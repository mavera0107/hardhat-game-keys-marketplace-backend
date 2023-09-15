// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error InsufficientFunds(uint256 available, uint256 required);
error PriceMustBeAboveZero();
error NoListingFound();
error TransferFailed();

contract GameKeyMarketplace {

    struct Game{
        uint256 gameId;
        string gameKey;
    }
    struct Listing {
        Game game;
        uint256 price;
        address seller;
    }


    event ItemListed(uint256 indexed gameId, uint256 indexed price, address indexed seller);
    event ItemBought(uint256 indexed gameId, uint256 indexed price, address indexed buyer);
    event ItemCancelled(uint256 indexed gameId, uint256 indexed price, address indexed seller);

    // gameId => seller => price => Listing[]
    mapping(uint256 => mapping(address => mapping(uint256 => Listing[]))) private listings;

    mapping(address => Game[]) private gamesBought;

    mapping(address => uint256) private balances;

    constructor() {
        
    }

    function listGameKey(string memory gameKey, uint256 gameId, uint256 price) external {
        if (price <=0 ) {
            revert PriceMustBeAboveZero();
        }
        listings[gameId][msg.sender][price].push(Listing(Game(gameId, gameKey), price, msg.sender));
        emit ItemListed(gameId, price, msg.sender);
    }

    function buyGameKey(uint256 gameId, address seller, uint256 price) external payable returns(string memory) {
        Listing[] memory listing = listings[gameId][seller][price];
        if(listing.length == 0) {
            revert NoListingFound();
        }
        if (price > msg.value) {
            revert InsufficientFunds(msg.value, price);
        }

        string memory gameKey = listing[listing.length -1].game.gameKey;
        gamesBought[msg.sender].push(Game(gameId, gameKey));

        if(listing.length == 1) {
            delete listings[gameId][seller][price];
        }else{
            listings[gameId][seller][price].pop();
        }
        balances[seller] += price;

        emit ItemBought(gameId, price, msg.sender);

        return gameKey;
    }

    function cancelListing(uint256 gameId, uint256 price) external {
        Listing[] memory listing = listings[gameId][msg.sender][price];
        if(listing.length == 0) {
            revert NoListingFound();
        }
        else if(listing.length == 1) {
            delete listings[gameId][msg.sender][price];
        }else{
            delete listings[gameId][msg.sender][price][listing.length - 1];
        }
        emit ItemCancelled(gameId, price, msg.sender);
    }

    function updateListing(uint256 gameId, uint256 price, uint256 newPrice) external {
        Listing[] memory listing = listings[gameId][msg.sender][price];
        if(listing.length == 0) {
            revert NoListingFound();
        }
        listings[gameId][msg.sender][newPrice].push(Listing(listing[listing.length - 1].game, newPrice, msg.sender));

        if(listing.length == 1) {
            delete listings[gameId][msg.sender][price];
        }else{
            listings[gameId][msg.sender][price].pop();
        }
    }

    function withdraw() external {
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        if(!success) {
            revert TransferFailed();
        }
    }

    function getGamesBought() external view returns(Game[] memory) {
        return gamesBought[msg.sender];
    }

    function getBalance() external view returns(uint256) {
        return balances[msg.sender];
    }
}