const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  args = []
  const gameKeyMarketplace = await deploy("GameKeyMarketplace", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })

  if (!developmentChains.includes(network.name)) {
    await verify(gameKeyMarketplace.address, args)
  }

  log("------------------------------------")
}

module.exports.tags = ["all", "gamekeymarketplace"]
