use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
#[test]
fn settlement_and_refunds() {
 let e=Env::default();e.mock_all_auths();
 let admin=Address::generate(&e);let resolver=Address::generate(&e);let a=Address::generate(&e);let b=Address::generate(&e);
 let t=e.register_stellar_asset_contract_v2(admin.clone());let tc=token::Client::new(&e,&t.address());let mint=token::StellarAssetClient::new(&e,&t.address());mint.mint(&a,&1000);mint.mint(&b,&1000);
 let id=e.register(PromiseMarket,(resolver.clone(),t.address()));let c=PromiseMarketClient::new(&e,&id);
 let market=c.create(&a,&String::from_str(&e,"Will a product launch?"),&String::from_str(&e,"Official public mainnet by deadline."),&String::from_str(&e,"https://example.com"),&100,&200);
 c.stake(&market,&a,&true,&100);c.stake(&market,&b,&false,&100);assert_eq!(tc.balance(&id),200);
 e.ledger().with_mut(|l|l.timestamp=200);
 c.resolve(&market,&1,&String::from_str(&e,"https://example.com/launch"),&String::from_str(&e,"Mainnet launched before deadline."));
 assert!(c.try_claim(&market,&a).is_err());
 e.ledger().with_mut(|l|l.timestamp=3800);
 assert_eq!(c.claim(&market,&a),200);assert_eq!(tc.balance(&a),1100);assert_eq!(c.claim(&market,&b),0);assert!(c.try_claim(&market,&a).is_err());
 let m=c.create(&a,&String::from_str(&e,"Will another product launch?"),&String::from_str(&e,"Official public mainnet by deadline."),&String::from_str(&e,"https://example.com"),&3900,&4000);
 c.stake(&m,&a,&true,&50);c.stake(&m,&b,&false,&50);
 e.ledger().with_mut(|l|l.timestamp=4000);c.resolve(&m,&3,&String::from_str(&e,"https://example.com"),&String::from_str(&e,"Evidence cannot establish an outcome."));
 e.ledger().with_mut(|l|l.timestamp=7600);assert_eq!(c.claim(&m,&a),50);assert_eq!(c.claim(&m,&b),50);assert_eq!(tc.balance(&id),0);assert_eq!(tc.balance(&resolver),0);
}
#[test]
fn timeout_no_winners_and_stake_guards() {
 let e=Env::default();e.mock_all_auths();let admin=Address::generate(&e);let r=Address::generate(&e);let a=Address::generate(&e);
 let t=e.register_stellar_asset_contract_v2(admin);token::StellarAssetClient::new(&e,&t.address()).mint(&a,&1000);
 let id=e.register(PromiseMarket,(r.clone(),t.address()));let c=PromiseMarketClient::new(&e,&id);
 let m=c.create(&a,&String::from_str(&e,"Will the product launch?"),&String::from_str(&e,"Official public mainnet by deadline."),&String::from_str(&e,"https://example.com"),&100,&200);
 assert!(c.try_stake(&m,&r,&true,&10).is_err());assert!(c.try_stake(&m,&a,&true,&0).is_err());c.stake(&m,&a,&false,&100);
 e.ledger().with_mut(|l|l.timestamp=200);assert!(c.try_stake(&m,&a,&true,&10).is_err());c.resolve(&m,&1,&String::from_str(&e,"https://example.com"),&String::from_str(&e,"Confirmed public launch."));
 e.ledger().with_mut(|l|l.timestamp=3800);assert_eq!(c.claim(&m,&a),100);
 let m2=c.create(&a,&String::from_str(&e,"Will the product launch again?"),&String::from_str(&e,"Official public mainnet by deadline."),&String::from_str(&e,"https://example.com"),&3900,&4000);c.stake(&m2,&a,&true,&100);
 e.ledger().with_mut(|l|l.timestamp=608800);assert_eq!(c.claim(&m2,&a),100);assert!(c.try_resolve(&m2,&1,&String::from_str(&e,"https://example.com"),&String::from_str(&e,"Late result must not be accepted.")).is_err());
}
#[test]
fn unauthorized_resolver_cannot_change_outcome() {
 let e=Env::default();let r=Address::generate(&e);let token=Address::generate(&e);let id=e.register(PromiseMarket,(r,token));let c=PromiseMarketClient::new(&e,&id);
 assert!(c.try_resolve(&0,&1,&String::from_str(&e,"https://example.com"),&String::from_str(&e,"Unauthorized attempt.")).is_err());
}

#[test]
fn proportional_profit_fees_and_both_sides_are_accounted_for() {
 let e=Env::default();e.mock_all_auths();let admin=Address::generate(&e);let r=Address::generate(&e);let a=Address::generate(&e);let b=Address::generate(&e);let loser=Address::generate(&e);
 let t=e.register_stellar_asset_contract_v2(admin);let mint=token::StellarAssetClient::new(&e,&t.address());let tc=token::Client::new(&e,&t.address());for u in [&a,&b,&loser] { mint.mint(u,&10000); }
 let id=e.register(PromiseMarket,(r.clone(),t.address()));let c=PromiseMarketClient::new(&e,&id);assert_eq!(c.fee_bps(),100);
 let m=c.create(&a,&String::from_str(&e,"Will Team A win the match?"),&String::from_str(&e,"Use the official final organiser result."),&String::from_str(&e,"https://example.com"),&100,&200);
 c.stake(&m,&a,&true,&1000);c.stake(&m,&a,&false,&1000);c.stake(&m,&b,&true,&1000);c.stake(&m,&loser,&false,&2000);
 e.ledger().with_mut(|l|l.timestamp=200);c.resolve(&m,&1,&String::from_str(&e,"https://example.com/results"),&String::from_str(&e,"The organiser confirms Team A wins."));e.ledger().with_mut(|l|l.timestamp=3800);
 // Each gross payout is 2500. A's profit is 500; B's is 1500.
 assert_eq!(c.claim(&m,&a),2496);assert_eq!(tc.balance(&r),3);assert_eq!(tc.balance(&a),10497);
 assert_eq!(c.claim(&m,&b),2486);assert_eq!(tc.balance(&r),13);assert_eq!(tc.balance(&a),10501);
 assert_eq!(c.claim(&m,&loser),0);assert_eq!(tc.balance(&r),13);assert_eq!(tc.balance(&id),0);
 assert!(c.try_claim(&m,&a).is_err());assert_eq!(tc.balance(&r),13);
}
#[test]
fn small_profit_rounds_fee_down_and_zero_profit_pays_no_fee() {
 let e=Env::default();e.mock_all_auths();let admin=Address::generate(&e);let r=Address::generate(&e);let a=Address::generate(&e);let b=Address::generate(&e);
 let t=e.register_stellar_asset_contract_v2(admin);let mint=token::StellarAssetClient::new(&e,&t.address());let tc=token::Client::new(&e,&t.address());mint.mint(&a,&1000);mint.mint(&b,&1000);
 let id=e.register(PromiseMarket,(r.clone(),t.address()));let c=PromiseMarketClient::new(&e,&id);
 let m=c.create(&a,&String::from_str(&e,"Will Team A win the match?"),&String::from_str(&e,"Use the official final organiser result."),&String::from_str(&e,"https://example.com"),&100,&200);
 c.stake(&m,&a,&true,&100);c.stake(&m,&b,&false,&99);
 e.ledger().with_mut(|l|l.timestamp=200);c.resolve(&m,&1,&String::from_str(&e,"https://example.com/results"),&String::from_str(&e,"The organiser confirms Team A wins."));e.ledger().with_mut(|l|l.timestamp=3800);assert_eq!(c.claim(&m,&a),199);assert_eq!(tc.balance(&r),0);
 let m2=c.create(&a,&String::from_str(&e,"Will Team A win the next match?"),&String::from_str(&e,"Use the official final organiser result."),&String::from_str(&e,"https://example.com"),&3900,&4000);c.stake(&m2,&a,&true,&100);
 e.ledger().with_mut(|l|l.timestamp=4000);c.resolve(&m2,&1,&String::from_str(&e,"https://example.com/results"),&String::from_str(&e,"The organiser confirms Team A wins."));e.ledger().with_mut(|l|l.timestamp=7600);assert_eq!(c.claim(&m2,&a),100);assert_eq!(tc.balance(&r),0);
}

#[test]
fn exact_split_pays_issuer_even_when_issuer_loses() {
 let e=Env::default();e.mock_all_auths();let r=Address::generate(&e);let issuer=Address::generate(&e);let winner=Address::generate(&e);
 let t=e.register_stellar_asset_contract_v2(Address::generate(&e));let mint=token::StellarAssetClient::new(&e,&t.address());let tc=token::Client::new(&e,&t.address());mint.mint(&issuer,&10000);mint.mint(&winner,&10000);
 let id=e.register(PromiseMarket,(r.clone(),t.address()));let c=PromiseMarketClient::new(&e,&id);assert_eq!(c.issuer_fee_bps(),30);assert_eq!(c.resolver_fee_bps(),70);
 let m=c.create(&issuer,&String::from_str(&e,"Will Team A win the match?"),&String::from_str(&e,"Use the official final organiser result."),&String::from_str(&e,"https://example.com"),&100,&200);
 c.stake(&m,&issuer,&false,&10000);c.stake(&m,&winner,&true,&10000);
 e.ledger().with_mut(|l|l.timestamp=200);c.resolve(&m,&1,&String::from_str(&e,"https://example.com/results"),&String::from_str(&e,"The organiser confirms Team A wins."));e.ledger().with_mut(|l|l.timestamp=3800);
 assert_eq!(c.claim(&m,&winner),19900);assert_eq!(tc.balance(&issuer),30);assert_eq!(tc.balance(&r),70);assert_eq!(c.claim(&m,&issuer),0);assert_eq!(tc.balance(&id),0);
 assert!(c.try_claim(&m,&winner).is_err());assert_eq!(tc.balance(&issuer),30);assert_eq!(tc.balance(&r),70);
}
