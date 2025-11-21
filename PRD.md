# Orai – AI-Verified Knowledge Oracle on 0G
## Product Requirements Document (PRD)

---

## 1. Executive Summary

**Orai** is a decentralized, AI-verified oracle system built on the **0G infrastructure** that combines blockchain technology with decentralized AI inference to provide trustless, verifiable knowledge to smart contracts and end users.

### Key Value Propositions
- Decentralized AI inference using 0G Compute
- Community-verified answers through token-weighted voting
- Tamper-proof computation and storage
- Smart contract integration for automated knowledge retrieval
- Provable answer authenticity with cryptographic hashing

---

## 2. Problem Statement

### Current Oracle Limitations
Traditional oracles suffer from critical weaknesses:
- **Data-only approach**: Only serve raw data without verification or reasoning
- **Centralization risks**: Vulnerable to manipulation and censorship
- **No inference capability**: Cannot provide AI-driven analysis or cross-source verification
- **Lack of transparency**: No community oversight mechanisms
- **Trust requirements**: Users must trust oracle operators

### The Orai Solution
Orai addresses these limitations by combining:
- **0G Compute**: Decentralized AI inference on distributed GPU nodes
- **0G Storage + DA**: Provable, permanent answer logs
- **Smart Contracts**: Trustless on-chain consumption
- **Token Governance**: Community-driven validation and oversight
- **Cryptographic Proofs**: Tamper-resistant proof-of-inference

---

## 3. Target Users

### Primary Segments

#### 1. DeFi Protocols
- **Need**: Verified real-world knowledge for lending, derivatives, insurance
- **Use Case**: Risk assessment, market analysis, compliance verification

#### 2. Prediction Markets
- **Need**: Ground truth for event resolution
- **Use Case**: Dispute resolution, outcome verification

#### 3. DAO Governance
- **Need**: Factual information for proposal evaluation
- **Use Case**: Research synthesis, impact assessment

#### 4. On-Chain Games
- **Need**: Dynamic, verifiable game state updates
- **Use Case**: Event outcomes, player stats, external data integration

#### 5. DApp Developers
- **Need**: Reliable off-chain truth integration
- **Use Case**: Application logic, user experience enhancement

#### 6. End Users
- **Need**: Trustworthy answers to complex questions
- **Use Case**: Research, fact-checking, decision support

---

## 4. Core Features

### 4.1 Wallet Connection

**Description**: Seamless wallet integration for all interactions

**Implementation**:
- **Technology**: RainbowKit + Wagmi
- **Supported Wallets**: All EVM-compatible wallets
- **Functionality**:
  - Question submission
  - Fee payment
  - Voting participation
  - Result verification

**User Flow**:
1. User clicks "Connect Wallet"
2. RainbowKit modal displays wallet options
3. User selects wallet and approves connection
4. Wallet address displayed in UI
5. User can access all platform features

---

### 4.2 Question Submission

**Description**: Users submit questions to the AI oracle for processing

**Input Parameters**:
- Question text (required, 10-500 characters)
- Reference URLs (optional, up to 5 URLs)
- Payment fee (calculated based on complexity)
- Priority level (optional, affects processing speed)

**Process Flow**:
1. User enters question in frontend form
2. Frontend validates input and calculates fee
3. User signs transaction with wallet
4. Backend receives question and payment
5. Question queued for processing
6. 0G compute job triggered
7. User receives confirmation with question ID

**Fee Structure**:
- Base fee: 0.1 ORAI tokens
- Complexity multiplier: 1-5x based on question length and reference count
- Priority fee: Optional 2x multiplier for faster processing

---

### 4.3 AI Answer Generation (0G Compute)

**Description**: Decentralized AI inference on 0G GPU network

**Technical Process**:
1. Backend submits job to 0G Compute
2. Multiple GPU nodes receive the task
3. Each node runs the AI model independently
4. Nodes generate:
   - Answer text
   - Evidence summary
   - Confidence score
   - Model hash
   - Input hash
   - Output hash

**Proof-of-Inference Components**:
- **Model Hash**: SHA-256 of model weights
- **Input Hash**: SHA-256 of question + context
- **Output Hash**: SHA-256 of generated answer
- **Node Signatures**: Cryptographic signatures from multiple nodes

**Output Structure**:
```json
{
  "answer": "The verified answer text",
  "evidence": "Summary of sources and reasoning",
  "confidence": 0.95,
  "modelHash": "0x...",
  "inputHash": "0x...",
  "outputHash": "0x...",
  "nodeSignatures": ["0x...", "0x..."],
  "timestamp": 1234567890
}
```

---

### 4.4 Voting & Validation System

**Description**: Token-weighted community validation of AI answers

**Voting Mechanics**:
- **Voting Power**: Proportional to staked ORAI tokens
- **Voting Options**: Correct / Incorrect / Abstain
- **Voting Period**: 24 hours from answer submission
- **Quorum**: Minimum 10% of staked tokens must participate

**Incentive Structure**:
- **Correct Voters**: Share reward pool (5% of question fee)
- **Incorrect Voters**: Partial stake slashing (2% penalty)
- **Malicious Actors**: Full stake slashing for coordinated attacks

**Validation Process**:
1. Answer published to voting interface
2. Token holders review answer and evidence
3. Voters stake tokens and submit vote
4. Voting period closes after 24 hours
5. Votes tallied weighted by stake
6. Result finalized if >66% consensus reached
7. Rewards distributed / penalties applied

**Edge Cases**:
- **No Quorum**: Answer marked as unverified, fees refunded
- **Split Vote**: Extended 12-hour voting period
- **Challenged Answer**: Escalated to governance review

---

### 4.5 Smart Contract Integration

**Description**: Programmatic oracle access for DApps and protocols

**Contract Interface**:
```solidity
interface IOraiOracle {
    // Submit a question
    function queryOracle(string calldata question) 
        external 
        payable 
        returns (bytes32 questionId);
    
    // Retrieve verified answer
    function getAnswer(bytes32 questionId) 
        external 
        view 
        returns (string memory answer);
    
    // Check verification status
    function isAnswerVerified(bytes32 questionId) 
        external 
        view 
        returns (bool verified);
    
    // Get full answer details
    function getAnswerDetails(bytes32 questionId)
        external
        view
        returns (
            string memory answer,
            uint256 confidence,
            uint256 timestamp,
            bool verified
        );
}
```

**Integration Lifecycle**:
1. DApp contract calls `queryOracle()` with question
2. Oracle contract emits `QuestionSubmitted` event
3. Backend listens for event and triggers 0G compute
4. Answer generated and stored on 0G Storage
5. Storage hash posted to oracle contract
6. Voting period completes
7. Answer marked as verified
8. DApp calls `getAnswer()` to retrieve result

**Events**:
```solidity
event QuestionSubmitted(bytes32 indexed questionId, address indexed requester, string question);
event AnswerReady(bytes32 indexed questionId, bytes32 storageHash);
event AnswerVerified(bytes32 indexed questionId, bool verified);
```

---

### 4.6 Fees & Tokenomics

**Fee Structure**:

| Component | Cost | Purpose |
|-----------|------|---------|
| Oracle Fee | 0.1-0.5 ORAI | Compute + storage costs |
| Priority Fee | +0.1 ORAI | Faster processing |
| Network Fee | Gas costs | Blockchain transaction |

**Token Utility**:

1. **Payment**: Users pay for oracle queries
2. **Staking**: Required for voting participation
3. **Governance**: Vote on protocol parameters
4. **Rewards**: Earned for correct validation

**Token Distribution**:
- 40% Community rewards pool
- 25% Development team (4-year vest)
- 20% Ecosystem fund
- 10% Initial liquidity
- 5% Advisors and partners

**Economic Model**:
- Total Supply: 100,000,000 ORAI
- Inflation: 2% annual for validator rewards
- Burn Mechanism: 10% of fees burned
- Staking APY: 15-25% based on participation

---

### 4.7 Backend Architecture

**Technology Stack**: Fastify + TypeScript + PostgreSQL

**Core Responsibilities**:
1. **Job Management**: Trigger and monitor 0G compute jobs
2. **Data Storage**: Store question metadata and results
3. **Verification**: Validate model hashes and output integrity
4. **Blockchain Interaction**: Monitor events, submit transactions
5. **API Services**: Provide REST endpoints for frontend

**Key Endpoints**:
- `POST /api/questions` - Submit new question
- `GET /api/questions/:id` - Retrieve question status
- `GET /api/answers/:id` - Fetch answer details
- `POST /api/votes` - Submit vote
- `GET /api/stats` - Platform statistics

---

### 4.8 Frontend Experience

**Technology Stack**: React + TypeScript + TailwindCSS + RainbowKit

**Key Pages**:

#### Home
- Platform overview
- Recent questions
- Statistics dashboard
- "Ask Oracle" CTA

#### Ask Oracle
- Question submission form
- Reference URL inputs
- Fee calculator
- Submission confirmation

#### Results
- Answer display
- Evidence presentation
- Voting interface
- Share functionality

#### Voting Dashboard
- Active votes list
- Voting history
- Staking management
- Rewards tracking

#### My Submissions
- Question history
- Answer status
- Fee breakdown
- Resubmit option

#### Developer Docs
- Integration guides
- Code examples
- API reference
- Best practices

---

## 5. Technical Architecture

### System Components

```
┌─────────────────┐
│  React Frontend │
│  (RainbowKit)   │
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼────────┐
│   Fastify    │◄───►│   Smart         │
│   Backend    │    │   Contracts     │
└───┬──────────┘    └─────────────────┘
    │                        │
    │                   ┌────▼─────┐
    │                   │  0G EVM  │
    │                   │  Chain   │
    │                   └──────────┘
    │
┌───┴────────────────────────────┐
│                                │
▼                                ▼
┌──────────────┐      ┌────────────────┐
│  0G Compute  │      │  0G Storage    │
│  (GPU Nodes) │      │  + DA Layer    │
└──────────────┘      └────────────────┘
```

### Data Flow

1. **Question Submission**: Frontend → Backend → Blockchain
2. **Compute Trigger**: Backend → 0G Compute
3. **Answer Generation**: AI Model on GPU Nodes
4. **Storage**: Answer → 0G Storage → Hash → Blockchain
5. **Voting**: Users → Smart Contract
6. **Verification**: Consensus → Answer Finalized
7. **Retrieval**: Frontend/DApps ← Smart Contract

---

## 6. Why 0G is Essential

Orai fundamentally depends on 0G infrastructure for:

### 1. Decentralized GPU Inference
**Requirement**: Trustless AI computation  
**0G Solution**: Distributed GPU network with proof-of-inference  
**Alternative**: No other chain provides this

### 2. Large-Scale Data Availability
**Requirement**: Store evidence, logs, and provenance cheaply  
**0G Solution**: Specialized DA layer with low costs  
**Alternative**: Ethereum/L2s are 100x+ more expensive

### 3. Deterministic AI Execution
**Requirement**: Reproducible outputs for verification  
**0G Solution**: Model + input hashing with multi-node consensus  
**Alternative**: Centralized APIs lack verifiability

### 4. Permanent Storage
**Requirement**: Immutable answer records  
**0G Solution**: 0G Storage with cryptographic proofs  
**Alternative**: IPFS lacks guaranteed permanence

### 5. EVM Compatibility
**Requirement**: Standard smart contract integration  
**0G Solution**: Native EVM chain for seamless deployment  
**Alternative**: Non-EVM chains require bridges

### Why Not Other Chains?

| Chain | Missing Capability |
|-------|-------------------|
| Ethereum | No decentralized AI compute |
| Optimism/Arbitrum | No AI inference layer |
| Polygon | No specialized DA for AI proofs |
| Solana | No EVM compatibility + no AI layer |
| Avalanche | No decentralized GPU network |

**Conclusion**: Orai requires 0G's unique combination of decentralized AI compute, cost-effective DA, and EVM compatibility. This cannot be replicated on any existing blockchain.

---

## 7. Success Metrics

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Answer Latency | <5 seconds average | 95th percentile response time |
| Vote Participation | >90% of questions | Votes cast / total questions |
| Node Consensus | >95% agreement | Matching outputs / total outputs |
| Uptime | 99.5% | Backend + smart contract availability |
| Storage Verification | 100% | Successful hash validations |

### Product KPIs

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Total Queries | 1,000+ | 3 months |
| Developer Integrations | 200+ | 6 months |
| User Satisfaction | 95% | Ongoing surveys |
| Token Holders | 5,000+ | 6 months |
| Active Voters | 60% of stakers | 3 months |

### Business KPIs

| Metric | Target | Purpose |
|--------|--------|---------|
| Revenue (Fees) | $50k/month | Sustainability |
| Token TVL | $1M+ | Network security |
| Partner Protocols | 10+ | Ecosystem growth |
| Documentation Views | 10k/month | Developer interest |

---

## 8. Risk Analysis & Mitigation

### Technical Risks

#### 1. Incorrect Voting
**Risk**: Voters validate wrong answers  
**Impact**: High - Undermines trust  
**Mitigation**:
- Stake slashing for malicious voting
- Reputation system for voters
- Multi-round voting for disputes
- Automated consistency checks

#### 2. Model Hallucination
**Risk**: AI generates false information  
**Impact**: Medium - Requires validation  
**Mitigation**:
- Multi-node consensus requirement
- Evidence citation enforcement
- Confidence score thresholds
- Community review process

#### 3. Backend Downtime
**Risk**: API unavailable for submissions  
**Impact**: Medium - Temporary disruption  
**Mitigation**:
- Redundant server infrastructure
- Client-side transaction submission
- Progressive decentralization roadmap
- Emergency fallback mode

#### 4. Smart Contract Vulnerabilities
**Risk**: Exploits or bugs in contracts  
**Impact**: Critical - Fund loss  
**Mitigation**:
- Comprehensive audit by 3+ firms
- Bug bounty program
- Gradual rollout with TVL caps
- Upgrade mechanism via governance

### Operational Risks

#### 5. Low Vote Participation
**Risk**: Insufficient quorum for validation  
**Impact**: Medium - Delayed answers  
**Mitigation**:
- Attractive staking rewards
- Gamification of voting
- Notification system for voters
- Reduced quorum with reputation weighting

#### 6. GPU Node Availability
**Risk**: Insufficient compute resources  
**Impact**: High - Service disruption  
**Mitigation**:
- Partner with 0G node operators
- Dynamic pricing to incentivize capacity
- Job queue and prioritization
- Fallback to secondary providers

### Market Risks

#### 7. Low Adoption
**Risk**: Insufficient user traction  
**Impact**: High - Business viability  
**Mitigation**:
- Free tier for early users
- Partnership with major DeFi protocols
- Developer grants program
- Community building initiatives

---

## 9. Development Roadmap

### Phase 1: MVP (Months 1-3)
- [ ] Basic frontend (ask, view results)
- [ ] Backend API and database
- [ ] Smart contract deployment
- [ ] 0G Compute integration
- [ ] Simple voting mechanism
- [ ] Testnet launch

### Phase 2: Enhancement (Months 4-6)
- [ ] Advanced voting with staking
- [ ] Developer documentation
- [ ] SDK for easy integration
- [ ] Performance optimization
- [ ] Security audit
- [ ] Mainnet preparation

### Phase 3: Growth (Months 7-12)
- [ ] Partner integrations (5+ protocols)
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Governance portal
- [ ] International expansion
- [ ] Token generation event

### Phase 4: Scale (Year 2)
- [ ] Multi-model support
- [ ] Specialized oracle types
- [ ] Cross-chain expansion
- [ ] Enterprise solutions
- [ ] Decentralized governance
- [ ] Protocol sustainability

---

## 10. Competitive Analysis

### Direct Competitors

#### Chainlink
**Strengths**: Established, wide adoption  
**Weaknesses**: No AI inference, data-only  
**Differentiation**: Orai provides reasoning + verification

#### Band Protocol
**Strengths**: Fast, low-cost  
**Weaknesses**: Limited to price feeds  
**Differentiation**: Orai handles complex questions

#### API3
**Strengths**: First-party data  
**Weaknesses**: No AI layer  
**Differentiation**: Orai adds intelligence layer

### Orai Advantages
1. **AI-Native**: Built for knowledge, not just data
2. **Decentralized Compute**: Trustless inference
3. **Community Validation**: Distributed verification
4. **0G Infrastructure**: Purpose-built for AI oracles
5. **Flexible**: Handles any question type

---

## 11. Go-to-Market Strategy

### Target Channels

#### 1. Developer Community
- Hackathons and bounties
- Technical blog content
- Open-source contributions
- Developer advocacy program

#### 2. DeFi Protocols
- Direct partnerships
- Integration workshops
- Custom oracle solutions
- Co-marketing initiatives

#### 3. Web3 Communities
- Twitter/X engagement
- Discord presence
- Reddit AMAs
- Podcast appearances

#### 4. Academic Institutions
- Research collaborations
- Educational content
- Student ambassador program
- Conference presentations

### Launch Strategy

**Pre-Launch (Month -2 to 0)**:
- Whitepaper release
- Community building
- Beta tester recruitment
- Media partnerships

**Launch (Month 1)**:
- Testnet public release
- Documentation site
- Launch campaign
- Initial partnerships announced

**Post-Launch (Months 2-6)**:
- Weekly product updates
- User feedback integration
- Expansion campaigns
- Mainnet preparation

---

## 12. Long-Term Vision

### Year 1: Establish Foundation
- Become the go-to AI oracle for 0G ecosystem
- 10+ major protocol integrations
- 100k+ questions processed
- Strong developer community

### Year 3: Market Leader
- Multi-chain expansion
- Enterprise adoption
- Decentralized governance
- Self-sustaining token economy

### Year 5: Industry Standard
- Default oracle for AI-native applications
- Research institution usage
- Government pilot programs
- Global knowledge infrastructure

---

## 13. Appendix

### Glossary

**0G Compute**: Decentralized GPU network for AI inference  
**0G Storage**: Permanent data storage layer  
**0G DA**: Data availability layer for blockchain  
**Proof-of-Inference**: Cryptographic proof that AI computation occurred correctly  
**Token-Weighted Voting**: Voting power proportional to staked tokens  
**Quorum**: Minimum participation required for valid vote  
**Slashing**: Penalty mechanism for malicious behavior

### References

- 0G Network Documentation
- EIP-4844 (Proto-Danksharding)
- Chainlink Whitepaper
- Academic papers on decentralized oracles
- Token engineering best practices

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Draft for Review  
**Next Review**: December 2024
