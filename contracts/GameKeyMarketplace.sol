// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error InsufficientFunds(uint256 available, uint256 required);
error PriceMustBeAboveZero();
error NoListingFound();
error TransferFailed();
error PercetageCantBeAbove100();

contract GameKeyMarketplace {

    struct Game{
        uint256 id;
        string key;
        string name;
        string image;
        string[] tags;
        string[] genres;
    }
    struct Listing {
        Game game;
        uint256 price;
        address seller;
    }

    event ItemListed(uint256 indexed gameId, uint256 indexed price,string gameName, string gameImage, string[] tags, string[] genres, address indexed seller);
    event ItemBought(uint256 indexed gameId, uint256 indexed price,string gameName, string gameImage, address indexed buyer);
    event ItemCancelled(uint256 indexed gameId, uint256 indexed price, address indexed seller);

    // gameId => seller => price => Listing[]
    mapping(uint256 => mapping(address => mapping(uint256 => Listing[]))) private listings;

    mapping(address => Game[]) private gamesBought;

    mapping(address => uint256) private balances;
    address private owner;
    uint256 private sellersPercentage;

    constructor() {
        balances[msg.sender] = 0;
        owner = msg.sender;
        sellersPercentage = 99;
    }

    function listGameKey(Game memory game,  uint256 price) external {
        if (price <=0 ) {
            revert PriceMustBeAboveZero();
        }
        listings[game.id][msg.sender][price].push(Listing(game, price, msg.sender));
        emit ItemListed(game.id , price,game.name,game.image,game.tags, game.genres, msg.sender);
    }


    function buyGameKey(uint256 gameId, address seller, uint256 price) external payable returns(string memory) {
        Listing[] memory listing = listings[gameId][seller][price];
        if(listing.length == 0) {
            revert NoListingFound();
        }
        if (price > msg.value) {
            revert InsufficientFunds(msg.value, price);
        }

        Game memory game = listing[listing.length -1].game;
        gamesBought[msg.sender].push(game);

        if(listing.length == 1) {
            delete listings[gameId][seller][price];
        }else{
            listings[gameId][seller][price].pop();
        }
        uint256 sellersPay = price * sellersPercentage / 100;
        balances[seller] += sellersPay;
        balances[owner] += msg.value - sellersPay;

        emit ItemBought(gameId, price, game.name,game.image, msg.sender);

        return game.key;
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
        Listing memory newListing = Listing(listing[listing.length - 1].game, newPrice, msg.sender);
        listings[gameId][msg.sender][newPrice].push(newListing);

        if(listing.length == 1) {
            delete listings[gameId][msg.sender][price];
        }else{
            listings[gameId][msg.sender][price].pop();
        }

        emit ItemCancelled(gameId, price, msg.sender);
        emit ItemListed(gameId, newPrice, newListing.game.name, newListing.game.image, newListing.game.tags, newListing.game.genres, msg.sender);
    }

    function withdraw() external {
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        if(!success) {
            revert TransferFailed();
        }
    }

    function ChangeSellersPercentage(uint256 newPercentage) external {
        if(msg.sender != owner) {
            revert("Only owner can change the percentage");
        }
        if (newPercentage > 100) {
            revert PercetageCantBeAbove100();
        }
        sellersPercentage = newPercentage;
    }

    function getGamesBought() external view returns(Game[] memory) {
        return gamesBought[msg.sender];
    }

    function getBalance() external view returns(uint256) {
        return balances[msg.sender];
    }
}