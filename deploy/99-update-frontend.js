const { ethers, network } = require("hardhat")
const fs = require("fs")
const path = require("path")

const frontendContractsFile = process.env.FRONTEND_CONTRACTS_FILE
const frontendAbiFile = process.env.FRONTEND_ABI_FILE

module.exports = async function () {
  if (process.env.UPDATE_FRONTEND) {
    console.log("Updating frontend...")
    await updateContractAddresses()
    await updateAbi()
  }
}

async function updateContractAddresses() {
  const GameKeyMarketplace = await ethers.getContract("GameKeyMarketplace")
  const chainId = network.config.chainId.toString()
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontendContractsFile, "utf8"),
  )
  console.log(GameKeyMarketplace)
  if (chainId in contractAddresses) {
    if (
      !contractAddresses[chainId]["GameKeyMarketplace"].includes(
        GameKeyMarketplace.target,
      )
    ) {
      contractAddresses[chainId]["GameKeyMarketplace"].push(
        GameKeyMarketplace.target,
      )
    }
  } else {
    contractAddresses[chainId] = {
      GameKeyMarketplace: [GameKeyMarketplace.target],
    }
  }
  fs.writeFileSync(frontendContractsFile, JSON.stringify(contractAddresses))
}

async function updateAbi() {
  const location =
    "../artifacts/contracts/GameKeyMarketplace.sol/GameKeyMarketplace.json"
  const { abi } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, location), "utf8"),
  )
  fs.writeFileSync(frontendAbiFile, JSON.stringify(abi))
}

module.exports.tags = ["all", "frontend"]
