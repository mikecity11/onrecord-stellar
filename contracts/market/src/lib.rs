#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub struct Market {
    pub creator: Address,
    pub question: String,
    pub rules: String,
    pub source: String,
    pub close: u64,
    pub deadline: u64,
    pub yes: i128,
    pub no: i128,
    pub outcome: u32,
    pub evidence: String,
    pub reason: String,
    pub claim_at: u64,
}
#[contracttype]
#[derive(Clone)]
pub struct Position { pub yes: i128, pub no: i128, pub claimed: bool }
#[contracttype]
#[derive(Clone)]
enum Key { Resolver, Token, Count, Market(u32), Position(u32, Address) }
#[contract]
pub struct PromiseMarket;
fn keep(e: &Env) { e.storage().instance().extend_ttl(100_000, 200_000); }
fn read(e: &Env, id: u32) -> Market {
    let k = Key::Market(id);
    let m = e.storage().persistent().get(&k).expect("unknown market");
    e.storage().persistent().extend_ttl(&k, 100_000, 200_000); m
}
fn save(e: &Env, id: u32, m: &Market) {
    let k = Key::Market(id); e.storage().persistent().set(&k, m);
    e.storage().persistent().extend_ttl(&k, 100_000, 200_000);
}
#[contractimpl]
impl PromiseMarket {
    pub fn __constructor(e: Env, resolver: Address, token: Address) {
        e.storage().instance().set(&Key::Resolver, &resolver);
        e.storage().instance().set(&Key::Token, &token);
        e.storage().instance().set(&Key::Count, &0u32); keep(&e);
    }
    pub fn fee_bps() -> u32 { 100 }
    pub fn config(e: Env) -> (Address, Address, u32) {
        keep(&e); (e.storage().instance().get(&Key::Resolver).unwrap(), e.storage().instance().get(&Key::Token).unwrap(), e.storage().instance().get(&Key::Count).unwrap())
    }
    pub fn create(e: Env, creator: Address, question: String, rules: String, source: String, close: u64, deadline: u64) -> u32 {
        creator.require_auth(); keep(&e);
        assert!(question.len() >= 10 && question.len() <= 240, "question length");
        assert!(rules.len() >= 20 && rules.len() <= 2000 && source.len() <= 500, "rules length");
        assert!(close > e.ledger().timestamp() && deadline >= close && deadline <= e.ledger().timestamp() + 2_592_000, "invalid deadline");
        let id: u32 = e.storage().instance().get(&Key::Count).unwrap();
        e.storage().instance().set(&Key::Count, &(id + 1));
        save(&e, id, &Market { creator, question, rules, source, close, deadline, yes: 0, no: 0, outcome: 0, evidence: String::from_str(&e, ""), reason: String::from_str(&e, ""), claim_at: 0 }); id
    }
    pub fn get(e: Env, id: u32) -> Market { keep(&e); read(&e, id) }
    pub fn position(e: Env, id: u32, user: Address) -> Position {
        let k = Key::Position(id, user);
        if e.storage().persistent().has(&k) { e.storage().persistent().extend_ttl(&k,100_000,200_000); }
        e.storage().persistent().get(&k).unwrap_or(Position { yes: 0, no: 0, claimed: false })
    }
    pub fn stake(e: Env, id: u32, user: Address, yes: bool, amount: i128) {
        user.require_auth(); keep(&e); let mut m = read(&e,id);
        assert!(m.outcome == 0 && e.ledger().timestamp() < m.close, "market closed");
        assert!(amount > 0 && amount <= 100_000_000, "stake must be at most 10 XLM");
        let resolver: Address = e.storage().instance().get(&Key::Resolver).unwrap();
        assert!(user != resolver, "resolver cannot stake");
        let mut p = Self::position(e.clone(),id,user.clone());
        assert!(!p.claimed, "already claimed");
        if yes { p.yes = p.yes.checked_add(amount).unwrap(); m.yes = m.yes.checked_add(amount).unwrap(); }
        else { p.no = p.no.checked_add(amount).unwrap(); m.no = m.no.checked_add(amount).unwrap(); }
        let token: Address = e.storage().instance().get(&Key::Token).unwrap();
        token::Client::new(&e,&token).transfer(&user,&e.current_contract_address(),&amount);
        let k = Key::Position(id,user); e.storage().persistent().set(&k,&p);
        e.storage().persistent().extend_ttl(&k,100_000,200_000); save(&e,id,&m);
    }
    // 1 = Yes, 2 = No, 3 = Unclear/refund. One-hour review delay, not an independent appeal.
    pub fn resolve(e: Env, id: u32, outcome: u32, evidence: String, reason: String) {
        let resolver: Address = e.storage().instance().get(&Key::Resolver).unwrap(); resolver.require_auth(); keep(&e);
        let mut m = read(&e,id);
        assert!(e.ledger().timestamp() >= m.deadline && e.ledger().timestamp() < m.deadline + 604_800, "outside resolution period");
        assert!(m.outcome == 0 || e.ledger().timestamp() < m.claim_at, "result final");
        assert!(outcome >= 1 && outcome <= 3 && evidence.len() >= 8 && evidence.len() <= 2000 && reason.len() >= 10 && reason.len() <= 2000, "invalid result");
        m.outcome = outcome; m.evidence = evidence; m.reason = reason;
        m.claim_at = e.ledger().timestamp() + 3600; save(&e,id,&m);
    }
    pub fn claim(e: Env, id: u32, user: Address) -> i128 {
        user.require_auth(); keep(&e); let m = read(&e,id);
        let timeout = e.ledger().timestamp() >= m.deadline + 604_800;
        assert!((timeout && m.outcome == 0) || (m.outcome != 0 && e.ledger().timestamp() >= m.claim_at), "not claimable");
        let mut p = Self::position(e.clone(),id,user.clone()); assert!(!p.claimed, "already claimed");
        let refund = m.outcome == 3 || m.outcome == 0 || (m.outcome == 1 && m.yes == 0) || (m.outcome == 2 && m.no == 0);
        let gross = if refund { p.yes + p.no } else {
            let (own,pool) = if m.outcome == 1 { (p.yes,m.yes) } else { (p.no,m.no) };
            own.checked_mul(m.yes + m.no).unwrap() / pool
        };
        // Fee only on positive net profit, including both sides of a user's stake.
        // Principal, losing positions and every refund are fee-free.
        let profit = if refund { 0 } else { (gross - p.yes - p.no).max(0) };
        let fee = profit / 100; // floor to whole stroops; exactly 1% before rounding
        let amount = gross - fee;
        p.claimed = true; let k = Key::Position(id,user.clone()); e.storage().persistent().set(&k,&p);
        e.storage().persistent().extend_ttl(&k,100_000,200_000);
        let t: Address = e.storage().instance().get(&Key::Token).unwrap();
        let tc = token::Client::new(&e,&t);
        if fee > 0 { let resolver: Address = e.storage().instance().get(&Key::Resolver).unwrap(); tc.transfer(&e.current_contract_address(),&resolver,&fee); }
        if amount > 0 { tc.transfer(&e.current_contract_address(),&user,&amount); } amount
    }
}

#[cfg(test)]
mod test;
