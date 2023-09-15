const { assert, expect } = require("chai")
const { deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("GameKeyMarketplace Unit Tests", function () {
      let gameKeyMarketplace, gameKeyMarketplaceContract
      const GAME_KEY = "GameKey1"
      const GAME_ID = 1
      const PRICE = ethers.parseEther("0.1")

      beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        user = accounts[1]
        await deployments.fixture(["all"])
        gameKeyMarketplaceContract =
          await ethers.getContract("GameKeyMarketplace")
        gameKeyMarketplace = gameKeyMarketplaceContract.connect(deployer)
      })

      it("lists a game key and can be bought", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)
        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          PRICE,
          {
            value: PRICE,
          },
        )
        const deployerBalance = await gameKeyMarketplace.getBalance()
        assert.equal(deployerBalance.toString(), PRICE.toString())
      })
      it("lists multiple game keys with different prices", async function () {
        // List two game keys with different GAME_IDs and prices
        await gameKeyMarketplace.listGameKey(
          "GameKey2",
          2,
          ethers.parseEther("0.2"),
        )
        await gameKeyMarketplace.listGameKey(
          "GameKey3",
          3,
          ethers.parseEther("0.3"),
        )

        // Connect the user to the GameKeyMarketplace contract
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)

        // Buy one of the listed game keys
        await userConnectedToGameKeyMarketplace.buyGameKey(
          2,
          deployer.address,
          ethers.parseEther("0.2"),
          {
            value: ethers.parseEther("0.2"),
          },
        )

        // Get the deployer's balance after the purchase
        const deployerBalance = await gameKeyMarketplace.getBalance()

        // Assert that the deployer's balance is equal to the remaining game key's price
        assert.equal(
          deployerBalance.toString(),
          ethers.parseEther("0.2").toString(),
        )
      })

      it("updates the price of a listed game key", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        const newPrice = ethers.parseEther("0.2")
        await gameKeyMarketplace.updateListing(GAME_ID, PRICE, newPrice)
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)
        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          newPrice,
          {
            value: newPrice,
          },
        )
        const deployerBalance = await gameKeyMarketplace.getBalance()
        assert.equal(deployerBalance.toString(), newPrice.toString())
      })

      it("withdraws balance from the contract", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)
        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          PRICE,
          {
            value: PRICE,
          },
        )
        const initialBalance = await ethers.provider.getBalance(
          deployer.address,
        )
        await gameKeyMarketplace.withdraw()
        const finalBalance = await ethers.provider.getBalance(deployer.address)

        assert.isTrue(finalBalance > initialBalance)
      })

      it("can remove a listed game", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        await gameKeyMarketplace.cancelListing(GAME_ID, PRICE)

        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)

        try {
          // Try to buy a non-existent game key listing
          await userConnectedToGameKeyMarketplace.buyGameKey(
            GAME_ID,
            deployer.address,
            PRICE,
            {
              value: PRICE,
            },
          )

          // If the transaction succeeds, fail the test
          assert.fail("Transaction should have reverted")
        } catch (error) {
          // Check if the error message matches the expected custom error
          assert.include(error.message, "NoListingFound")
        }
      })
      it("returns the games bought by the caller", async function () {
        // Create an instance of the contract connected to the user
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)

        // List a few game keys for the user
        await gameKeyMarketplace.listGameKey(
          "GameKey7",
          7,
          ethers.parseEther("0.2"),
        )
        await gameKeyMarketplace.listGameKey(
          "GameKey8",
          8,
          ethers.parseEther("0.3"),
        )

        // Buy the listed game keys
        await userConnectedToGameKeyMarketplace.buyGameKey(
          7,
          deployer.address,
          ethers.parseEther("0.2"),
          {
            value: ethers.parseEther("0.2"),
          },
        )
        await userConnectedToGameKeyMarketplace.buyGameKey(
          8,
          deployer.address,
          ethers.parseEther("0.3"),
          {
            value: ethers.parseEther("0.3"),
          },
        )

        // Call the getGamesBought function to retrieve the games bought by the user
        const userGamesBought =
          await userConnectedToGameKeyMarketplace.getGamesBought()

        // Assert that the returned array has the expected length (number of games bought)
        assert.equal(userGamesBought.length, 2)

        // Assert that the first game in the array has the expected gameId and gameKey
        assert.equal(userGamesBought[0].gameId, 7)
        assert.equal(userGamesBought[0].gameKey, "GameKey7")

        // Assert that the second game in the array has the expected gameId and gameKey
        assert.equal(userGamesBought[1].gameId, 8)
        assert.equal(userGamesBought[1].gameKey, "GameKey8")
      })

      it("games get removed from listing when there is multiple of the same one", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        await gameKeyMarketplace.listGameKey("GAME_KEY2", GAME_ID, PRICE)
        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)
        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          PRICE,
          {
            value: PRICE,
          },
        )

        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          PRICE,
          {
            value: PRICE,
          },
        )
        try {
          await userConnectedToGameKeyMarketplace.buyGameKey(
            GAME_ID,
            deployer.address,
            PRICE,
            {
              value: PRICE,
            },
          )

          // If the transaction succeeds, fail the test
          assert.fail("Transaction should have reverted")
        } catch (error) {
          // Check if the error message matches the expected custom error
          assert.include(error.message, "NoListingFound")
        }
      })
      it("updates one game key listing with a new price for multiple the same games and costs", async function () {
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        await gameKeyMarketplace.listGameKey(GAME_KEY, GAME_ID, PRICE)
        const newPrice = ethers.parseEther("0.2")
        await gameKeyMarketplace.updateListing(GAME_ID, PRICE, newPrice)

        const userConnectedToGameKeyMarketplace =
          gameKeyMarketplace.connect(user)
        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          PRICE,
          {
            value: PRICE,
          },
        )

        await userConnectedToGameKeyMarketplace.buyGameKey(
          GAME_ID,
          deployer.address,
          newPrice,
          {
            value: newPrice,
          },
        )
        try {
          // Try to buy a non-existent game key listing
          await userConnectedToGameKeyMarketplace.buyGameKey(
            GAME_ID,
            deployer.address,
            PRICE,
            {
              value: PRICE,
            },
          )
        } catch (error) {
          assert.include(error.message, "NoListingFound")
        }
      })
    })
