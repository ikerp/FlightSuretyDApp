import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import 'babel-polyfill';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));

web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

var numberOracles = 40;
var oracles = [];

(async () => {
  let accounts = await web3.eth.getAccounts();
  let oraclesAccounts = accounts.slice(20, 20 + numberOracles);

  await flightSuretyData.methods.authorizeCaller(config.appAddress).send({from: accounts[0]});
  
  let registrationFee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  oraclesAccounts.forEach(async (oracleAddress) => {
    await flightSuretyApp.methods.registerOracle().send({from:oracleAddress, value:registrationFee, gas:3000000});
    let oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({from:oracleAddress});
    oracles.push({
      address:oracleAddress,
      indexes:oracleIndexes
    });
  });
})().catch(err => {
  console.error(err);
});


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {
      console.log(error)
    } else {
      let requiredIndex = event.returnValues[0];
      oracles.forEach(async (oracle) => {
        if (oracle.indexes.includes(requiredIndex)) {
          let flightStatusCode = Math.floor((Math.random() * 6)) * 10;
          console.log(flightStatusCode);
          await flightSuretyApp.methods.submitOracleResponse(requiredIndex, event.returnValues[1], event.returnValues[2], event.returnValues[3], flightStatusCode)
          .send({from: oracle.address, gas: 3000000})
          .catch((error) =>{
            console.log(error);
          });
        }
      })
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


