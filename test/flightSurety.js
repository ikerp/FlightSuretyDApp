
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`first airline is registered`, async function () {

    let statusFirstAirline = await config.flightSuretyData.isAirlineRegistered.call(accounts[1]);
      
    assert.equal(statusFirstAirline, true, "First airline is not registered");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline1 = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline1, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline1);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it(`(airline) can register an Airline using registerAirline() if it is funded`, async () =>{
    // arrange
    let newAirline1 = accounts[2];
    // act
    let result1 = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline);
    await config.flightSuretyApp.fund({from:config.firstAirline, value: web3.utils.toWei("10", "ether")});
    let result2 = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline);
    let result3 = await config.flightSuretyData.isAirlineRegistered.call(newAirline1);
    await config.flightSuretyApp.registerAirline(newAirline1, {from: config.firstAirline});
    let result4 = await config.flightSuretyData.isAirlineRegistered.call(newAirline1);
    // assert
    assert.equal(result1, false, "Airline should not be operative befor sending funds");
    assert.equal(result2, true, "Airline should be funded after sending > 10ETH");
    assert.equal(result3, false, "Airline should not be registered before a funded airline registers it");
    assert.equal(result4, true, "Airline should be able to register another airline if it has provided funding");
  });

  it(`(airline) can register an Airline using registerAirline() until there are four airlines registered`, async () =>{
    // arrange
    let newAirline2 = accounts[3];
    let newAirline3 = accounts[4];
    let newAirline4 = accounts[5];
    // act
    await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline});
    await config.flightSuretyApp.registerAirline(newAirline3, {from: config.firstAirline});
    let isAirline3Registered = await config.flightSuretyData.isAirlineRegistered.call(newAirline3);
    let registeredAirlinesCount1 = await config.flightSuretyData.registeredAirlinesCount.call();
    await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline});
    let isAirline4Registered = await config.flightSuretyData.isAirlineRegistered.call(newAirline4);
    let registeredAirlinesCount2 = await config.flightSuretyData.registeredAirlinesCount.call();
    // assert
    assert.equal(isAirline3Registered, true, "Airline should be registered until there are 4 airlines registered");
    assert.equal(Number(registeredAirlinesCount1), 4, "Airline count should be the maximum before reaching consensus requirement")
    assert.equal(isAirline4Registered, false, "With 4 airlines registered, new Airline should not be registered without consensus requirement");
    assert.equal(Number(registeredAirlinesCount1), Number(registeredAirlinesCount2), "With 4 airlines registered, registered airlines count shoud not change without consensus at this point");
  });

  it(`(multiparty) should reach 50% consensus to register an Airline when there are four or more airlines registered`, async () =>{
    // arrange
    let newAirline1 = accounts[2];
    let newAirline4 = accounts[5];
    let newAirline5 = accounts[6];
    // act
    await config.flightSuretyApp.fund({from:newAirline1, value: web3.utils.toWei("10", "ether")});
    await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline1});
    let isAirline4Registered = await config.flightSuretyData.isAirlineRegistered.call(newAirline4);
    let registeredAirlinesCount1 = await config.flightSuretyData.registeredAirlinesCount.call();

    await config.flightSuretyApp.fund({from:newAirline4, value: web3.utils.toWei("10", "ether")});
    await config.flightSuretyApp.registerAirline(newAirline5, {from: config.firstAirline});
    await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline1});
    let isAirline5Registered = await config.flightSuretyData.isAirlineRegistered.call(newAirline5);
    await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline4});
    let isAirline5RegisteredAfterConsensus = await config.flightSuretyData.isAirlineRegistered.call(newAirline5);
    let registeredAirlinesCount2 = await config.flightSuretyData.registeredAirlinesCount.call();

    // assert
    assert.equal(isAirline4Registered, true, "With 4 airlines registered, new Airline should be registered when consensus is reached");
    assert.equal(Number(registeredAirlinesCount1), 5, "Registered airlines count shoud increment when consensus is reached (2 votes)")
    assert.equal(isAirline5Registered, false, "With 5 airlines registered, new Airline should not be registered if consensus is not reached (3 votes)");
    assert.equal(isAirline5RegisteredAfterConsensus, true, "With 5 airlines registered, new Airline should be registered when consensus is reached (3 votes)");
    assert.equal(Number(registeredAirlinesCount2), 6, "Registered airlines count shoud increment when consensus is reached (3 votes)")
  });

  it(`(passenger) can pay up to 1 ETH for purchasing flight insurance`, async () =>{

    // arrange
    let passenger = accounts[9];

    // act
    let initialBalance = await web3.eth.getBalance(passenger);
    await config.flightSuretyApp.buy("3946", {from:passenger, value:web3.utils.toWei("1", "ether"), gasPrice:0});
    try {
      await config.flightSuretyApp.buy("3946", {from:passenger, value:web3.utils.toWei("1", "ether"), gasPrice:0});
    }
    catch(e) {
      console.log(e.reason);
    }
    try {
      await config.flightSuretyApp.buy("3949", {from:passenger, value:web3.utils.toWei("2", "ether"), gasPrice:0});
    }
    catch(e) {
      console.log(e.reason);
    } 
    let finalBalance = await web3.eth.getBalance(passenger);

    // assert
    assert.equal(Number(finalBalance), Number(initialBalance - web3.utils.toWei("1", "ether")), "Only the first purchase should be valid");
  });

  it(`(passenger) receives credit of 1.5x the amount paid if flight is delayed due to airline fault`, async () =>{

    // arrange
    let passenger = accounts[9];

    // act
    let initialBalance = await web3.eth.getBalance(passenger);
    await config.flightSuretyApp.buy("3949", {from:passenger, value: web3.utils.toWei("0.5", "ether"), gasPrice:0});
    let finalBalance = await web3.eth.getBalance(passenger);
    let insurance = await config.flightSuretyData.getInsurance.call("3949", passenger);

    await config.flightSuretyData.authorizeCaller(passenger, {from:config.owner});
    await config.flightSuretyData.creditInsurees("3949", 1500000, {from: passenger, gasPrice:0});
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from:config.owner});
    let credit = await config.flightSuretyData.passengerCredit.call(passenger);
    let expectedBalance = BigNumber(initialBalance).minus(BigNumber(web3.utils.toWei("0.5", "ether")));

    // assert
    assert.equal(Number(finalBalance), Number(expectedBalance), "Passenger balance should reflect the insurance purchase");
    assert.equal(Number(insurance), web3.utils.toWei("0.5", "ether"), "Insurance value should equal the amount the passenger has sent")
    assert.equal(Number(credit), web3.utils.toWei("0.75", "ether"), "Passenger credit should be 1.5x the amount paid")
  });

  it(`(passenger) can withdraw the credit received for insurance payout`, async () =>{
    // arrange
    let passenger = accounts[9];

    // act
    let initialBalance = await web3.eth.getBalance(passenger);
    let initialBalanceData = await web3.eth.getBalance(config.flightSuretyData.address);

    await config.flightSuretyData.authorizeCaller(passenger, {from:config.owner});
    await config.flightSuretyData.pay(passenger, {from:passenger, gasPrice:0});
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from:config.owner});

    let finalBalance = await web3.eth.getBalance(passenger);
    let finalBalanceData = await web3.eth.getBalance(config.flightSuretyData.address);

    let credit = await config.flightSuretyData.passengerCredit.call(passenger);
    let expectedBalance = BigNumber(initialBalance).plus(BigNumber(web3.utils.toWei("0.75", "ether")));  
    let expectedBalanceData = BigNumber(initialBalanceData).minus(BigNumber(web3.utils.toWei("0.75", "ether")));

    // assert
    assert.equal(Number(finalBalanceData), Number(expectedBalanceData), "Contract balance should reflect the withdrawal");
    assert.equal(Number(expectedBalance), Number(finalBalance), "Passenger balance should reflect the withdrawal");
    assert.equal(Number(credit), 0, "Passengers credit should be zero after the withdrawal")
  });
 
});
