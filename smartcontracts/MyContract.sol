// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Chainlink, ChainlinkClient} from "@chainlink/contracts@1.1.1/src/v0.8/ChainlinkClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.1.1/src/v0.8/shared/access/ConfirmedOwner.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.1.1/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


interface IToken {
    function acceptOwnership() external;
    function mint(address to, uint256 value) external;
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferOwnership(address to) external;
}

contract MyContract is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;
    using Strings for string;

    struct Tokens {
        address ruble;
        address gold;
        address silver;
        address platinum;
        address palladium;
    }

    Tokens public tokens;

    struct ITokens {
        IToken ruble;
        IToken gold;
        IToken silver;
        IToken platinum;
        IToken palladium;
    }

    ITokens public itokens;

    uint256 private constant ORACLE_PAYMENT = (1 * LINK_DIVISIBILITY) / 10; // 0.1 * 10**18
    
    struct Prices {
        uint256 goldbuy;
        uint256 goldsell;
        uint256 silverbuy;
        uint256 silversell;
        uint256 platinumbuy;
        uint256 platinumsell;
        uint256 palladiumbuy;
        uint256 palladiumsell;
    }

    Prices public prices;

    struct LastUpdated {
        uint256 goldbuy;
        uint256 goldsell;
        uint256 silverbuy;
        uint256 silversell;
        uint256 platinumbuy;
        uint256 platinumsell;
        uint256 palladiumbuy;
        uint256 palladiumsell;
    }

    LastUpdated public lastUpdated;
    address public _oracle;
    bytes32 public _jobId;


    event RequestPriceFulfilled(
        bytes32 indexed requestId,
        uint256 indexed price
    );

    /**
     *  Sepolia
     *@dev LINK address in Sepolia network: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * @dev Check https://docs.chain.link/docs/link-token-contracts/ for LINK address for the right network
     */
    constructor(address oracle, string memory jobid) ConfirmedOwner(msg.sender) {
        _setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        setOracle(oracle);
        setJobId(jobid);
    }

    function setOracle(address newOracle) public onlyOwner {
        _oracle = newOracle;
    }

    function setJobId(string memory newJobId) public onlyOwner {
        _jobId = stringToBytes32(newJobId);
    }

    function requestPrice(
        string memory _metal,
        string memory _priceType
    ) public onlyOwner {
        if(!(_priceType.equal("BUY") || _priceType.equal("SELL"))) {
            revert("This price type is not supported");
        }

        string memory metalid;
        if(_metal.equal("gold")) {
            metalid = "1";
        } else if(_metal.equal("silver")) {
            metalid = "2";
        } else if(_metal.equal("platinum")) {
            metalid = "3";
        } else if(_metal.equal("palladium")) {
            metalid = "4";
        } else {
            revert("This metal is not supported");
        }

        bytes4 fulfiller;
        if(metalid.equal("1")) {
            if(_priceType.equal("BUY")) {
                fulfiller = this.fulfillGoldBuyPrice.selector;
            } else {
                fulfiller = this.fulfillGoldSellPrice.selector;
            }
        } else if(metalid.equal("2")) {
            if(_priceType.equal("BUY")) {
                fulfiller = this.fulfillSilverBuyPrice.selector;
            } else {
                fulfiller = this.fulfillSilverSellPrice.selector;
            }
        } else if(metalid.equal("3")) {
            if(_priceType.equal("BUY")) {
                fulfiller = this.fulfillPlatinumBuyPrice.selector;
            } else {
                fulfiller = this.fulfillPlatinumSellPrice.selector;
            }
        } else {
            if(_priceType.equal("BUY")) {
                fulfiller = this.fulfillPalladiumBuyPrice.selector;
            } else {
                fulfiller = this.fulfillPalladiumSellPrice.selector;
            }
        }

        string memory url = string.concat("http://127.0.0.1:3000/api/metals/", metalid);

        Chainlink.Request memory req = _buildChainlinkRequest(
            _jobId,
            address(this),
            fulfiller
        );

        req._add(
            "get",
            url
        );

        req._add("path", _priceType);
        req._addInt("times", 100);
        _sendChainlinkRequestTo(_oracle, req, ORACLE_PAYMENT);
    }

    function setToken(string memory name, address addr) public onlyOwner {
        if(name.equal("ruble")) {
            tokens.ruble = addr;
            itokens.ruble = IToken(addr);
            itokens.ruble.acceptOwnership();
        } else if(name.equal("gold")) {
            tokens.gold = addr;
            itokens.gold = IToken(addr);
            itokens.gold.acceptOwnership();
        } else if(name.equal("silver")) {
            tokens.silver = addr;
            itokens.silver = IToken(addr);
            itokens.silver.acceptOwnership();
        } else if(name.equal("platinum")) {
            tokens.platinum = addr;
            itokens.platinum = IToken(addr);
            itokens.platinum.acceptOwnership();
        } else if(name.equal("palladium")) {
            tokens.palladium = addr;
            itokens.palladium = IToken(addr);
            itokens.palladium.acceptOwnership();
        } else {
            revert("Unknown token name");
        }
    }

    function passTokenOwnership(string memory name, address addr) public onlyOwner {
        if(name.equal("ruble")) {
            itokens.ruble.transferOwnership(addr);
        } else if(name.equal("gold")) {
            itokens.gold.transferOwnership(addr);
        } else if(name.equal("silver")) {
            itokens.silver.transferOwnership(addr);
        } else if(name.equal("platinum")) {
            itokens.platinum.transferOwnership(addr);
        } else if(name.equal("palladium")) {
            itokens.palladium.transferOwnership(addr);
        } else {
            revert("Unknown token name");
        }
    }

    function buyMetal(string memory metal, uint256 amount) public {
        uint256 lu;
        uint256 price;
        IToken itoken;

        if(metal.equal("gold")) {
            lu = lastUpdated.goldbuy;
            price = prices.goldbuy;
            itoken = itokens.gold;
        } else if(metal.equal("silver")) {
            lu = lastUpdated.silverbuy;
            price = prices.silverbuy;
            itoken = itokens.silver;
        } else if(metal.equal("platinum")) {
            lu = lastUpdated.platinumbuy;
            price = prices.platinumbuy;
            itoken = itokens.platinum;
        } else if(metal.equal("palladium")) {
            lu = lastUpdated.palladiumbuy;
            price = prices.palladiumbuy;
            itoken = itokens.palladium;
        } else {
            revert("Unknown metal");
        }

        if(block.timestamp - lu > 1 days) {
            revert("Please update the price for your metal first");
        }

        itokens.ruble.transferFrom(msg.sender, address(this), (amount * price) / 100);
        uint256 balance = itoken.balanceOf(address(this));
        if(balance < amount) {
            itoken.mint(address(this), amount - balance);
        }
        itoken.transfer(msg.sender, amount);
    }

    function sellMetal(string memory metal, uint256 amount) public {
        uint256 lu;
        uint256 price;
        IToken itoken;

        if(metal.equal("gold")) {
            lu = lastUpdated.goldsell;
            price = prices.goldsell;
            itoken = itokens.gold;
        } else if(metal.equal("silver")) {
            lu = lastUpdated.silversell;
            price = prices.silversell;
            itoken = itokens.silver;
        } else if(metal.equal("platinum")) {
            lu = lastUpdated.platinumsell;
            price = prices.platinumsell;
            itoken = itokens.platinum;
        } else if(metal.equal("palladium")) {
            lu = lastUpdated.palladiumsell;
            price = prices.palladiumsell;
            itoken = itokens.palladium;
        } else {
            revert("Unknown metal");
        }

        if(block.timestamp - lu > 1 days) {
            revert("Please update the price for your metal first");
        }

        itoken.transferFrom(msg.sender, address(this), amount);
        uint256 balance = itokens.ruble.balanceOf(address(this));
        if(balance < amount) {
            itokens.ruble.mint(address(this), amount - balance);
        }
        itokens.ruble.transfer(msg.sender, (amount * price) / 100);
    }

    function getBonusRubles() public {
        itokens.ruble.mint(msg.sender, 1000000 * 10 ** 18);
    }

    function fulfillGoldBuyPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.goldbuy = _price;
        lastUpdated.goldbuy = block.timestamp;
    }

    function fulfillGoldSellPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.goldsell = _price;
        lastUpdated.goldsell = block.timestamp;
    }
    
    function fulfillSilverBuyPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.silverbuy = _price;
        lastUpdated.silverbuy = block.timestamp;
    }

    function fulfillSilverSellPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.silversell = _price;
        lastUpdated.silversell = block.timestamp;
    }

    function fulfillPlatinumBuyPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.platinumbuy = _price;
        lastUpdated.platinumbuy = block.timestamp;
    }

    function fulfillPlatinumSellPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.platinumsell = _price;
        lastUpdated.platinumsell = block.timestamp;
    }

    function fulfillPalladiumBuyPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.palladiumbuy = _price;
        lastUpdated.palladiumbuy = block.timestamp;
    }

    function fulfillPalladiumSellPrice(
        bytes32 _requestId,
        uint256 _price
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestPriceFulfilled(_requestId, _price);
        prices.palladiumsell = _price;
        lastUpdated.palladiumsell = block.timestamp;
    }


    function getChainlinkToken() public view returns (address) {
        return _chainlinkTokenAddress();
    }

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) public onlyOwner {
        _cancelChainlinkRequest(
            _requestId,
            _payment,
            _callbackFunctionId,
            _expiration
        );
    }

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }
}
