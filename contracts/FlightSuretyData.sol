pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    address private authorizedCaller;

    struct Airline {
        bool isRegistered;
        bool isFunded;
    }
    mapping(address => Airline) private airlines;
    address[] registeredAirlines = new address[](0);

    struct Insurance {
        address passenger;
        uint256 amount;
    }
    mapping(string => Insurance[]) private insurances;

    mapping(address => uint256) private passengerCredits;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline) public {
        contractOwner = msg.sender;

        // first airline is registered when contract is deployed
        airlines[firstAirline] = Airline({isRegistered: true, isFunded: false});
        registeredAirlines.push(firstAirline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireFundedAirline() {
        require(airlines[msg.sender].isFunded, "Caller is not a funded airline");
        _;
    }

    modifier requireAuthorizedCaller() {
        require(msg.sender == authorizedCaller, "The caller is not authorized to call this function");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool) {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address _authorizedCaller) external requireIsOperational requireContractOwner {
        authorizedCaller = _authorizedCaller;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address newAirline) external requireIsOperational requireAuthorizedCaller returns(bool) {
        airlines[newAirline] = Airline({isRegistered: true, isFunded: false});
        registeredAirlines.push(newAirline);
        return true;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(string flight, address passenger) external payable requireIsOperational requireAuthorizedCaller {
        // require passenger has not purchased a previous insurance for that flight
        bool isDuplicate = false;
        for (uint i = 0; i < insurances[flight].length; i++) {
            if (insurances[flight][i].passenger == passenger) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "The passenger has already purchased an insurance for this flight");

        insurances[flight].push(Insurance({passenger: passenger, amount: msg.value}));
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees (string flight, uint256 sixDecimalMultiplier) external requireIsOperational requireAuthorizedCaller {
        for (uint i = 0; i < insurances[flight].length; i++) {
            passengerCredits[insurances[flight][i].passenger] = passengerCredits[insurances[flight][i].passenger].add(insurances[flight][i].amount.mul(sixDecimalMultiplier).div(1000000));
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address passenger) external requireIsOperational requireAuthorizedCaller {
        require(passengerCredits[passenger] > 0, "The insuree has no credit to transfer");
        uint256 credit = passengerCredits[passenger];
        passengerCredits[passenger] = 0;
        passenger.transfer(credit);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund(address fundingAirline) public payable requireIsOperational requireAuthorizedCaller {
        airlines[fundingAirline].isFunded = true;
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function isAirlineRegistered(address airline) external view returns(bool) {
        return airlines[airline].isRegistered;
    }

    function isAirlineFunded(address airline) external view returns(bool) {
        return airlines[airline].isFunded;
    }

    function registeredAirlinesCount() external view returns(uint256) {
        return registeredAirlines.length;
    }

    function getInsurance(string flight, address passenger) external view returns(uint256) {
        for (uint i = 0; i < insurances[flight].length; i++) {
            if (insurances[flight][i].passenger == passenger) {
                return insurances[flight][i].amount;
            }
        }
        return 0;
    }

    function passengerCredit(address passenger) external view returns(uint256) {
        return passengerCredits[passenger];
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        fund(msg.sender);
    }

}

