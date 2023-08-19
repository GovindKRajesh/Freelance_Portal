# Decentralized Freelance Portal

## WORK IN PROGRESS

### Summary

The idea for this project is to create a fully decentralized freelance job portal. The primary functionalities are listed below:

- Potential clients can register on the portal, and then post jobs.
- Freelancers can browse through available jobs and apply.
- Clients can filter through applications and select the freelancer they prefer.
- Clients can submit milestones against an assigned job, making a payment to the Smart contract in stablecoins.
- Once the milestone is achieved, the client can release the milestone, which transfers the amount to the freelancer.

### Components

- [ ] Front end
  - [ ] Login/Register page
  - [ ] Profile page
  - [ ] Job Management page
  - [ ] Milestone Management page
- [ ] Back end
  - Primarily for business logic, exact details TBD
- [x] Blockchain side
  - [x] User contract - For storing user data and registration.
  - [x] Job contract - For creating, editing, applying to, and selecting freelancers for jobs.
  - [x] Payments contract - For milestone creation, release and subsequent payment management.

### Tech stack

- Front end: To be made using React.
- Back end: To be made using Node.
- Blockchain: Made using Solidity, makes use of Chai framework for automated testing.
