import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';


export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 =  new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545'));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            this.flightSuretyApp.events.allEvents({ fromBlock: 'latest' }, function(error, event){ console.log(event); })

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        };
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                this.flightSuretyApp.once('FlightStatusInfo', { fromBlock: 'latest' }, function(error, event){
                    callback(error, event.returnValues[3]);
                })
                // callback(error, payload.flight);
            });
    }

    buyInsurance(flight, amount, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000),
            amount: amount
        }
        self.flightSuretyApp.methods
            .buy(payload.flight)
            .send({ from: self.passengers[0], value: self.web3.utils.toWei(String(payload.amount), "ether"), gas: 1500000}, async (error, result) => {
                if (error) {
                    callback(error, payload);
                } else {
                    let insurance = await self.flightSuretyApp.methods.getInsurance(payload.flight, self.passengers[0]).call();
                    callback(error, Number(web3.fromWei(insurance, 'ether')));
                }
            });
    };
}