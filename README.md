# FlightSurety

![ui screenshot](screenshots/Captura.PNG)

FlightSurety is a sample application project for Udacity's Blockchain course and it's based on the template provided in that couse.

This application provides a user interface that allows passengers to purchase an insurance (<1ETH) for a selected flight and check the status of that flight based on the information provided from the oracles. If the status code of the flight shows that it's late due to the airline (20), the passenger will receive credit of 1.5x the amount purchased.

In this sample, the oracle registration (+20) and their behavior is simulated by the server. Both the UI and the server interact and listen to the smart contracts that register all the data and the business logic of the project: FlightSuretyData.sol manages the data persistence and FlightSuretyApp.sol manages the app logic and the oracles code.

The smart contracts provide some functions that haven't been implemented on the UI yet:
* new airline registration from a registered airline (for the first 4 airlines)
* multi-party consensus of new airline registration (for the fifth and subsequent airlines)
* airlines need to be funded to participate in contract (10ETH)
* passengers can withdraw any funds owed to them as a result of receiving credit for insurance payout

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
