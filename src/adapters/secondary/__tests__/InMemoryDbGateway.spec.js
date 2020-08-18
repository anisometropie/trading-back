import { InMemoryDbGateway } from '../InMemoryDbGateway'

describe('InMemoryDbGateway', () => {
  let DbGateway

  describe('constructor', () => {
    it('should have 0 balance by default', () => {
      initializeTest()
      expect(DbGateway.assets).toEqual([{ symbol: 'usd', quantity: 0 }])
    })
  })

  describe('addAsset', () => {
    it('should add to balance', () => {
      initializeTest()
      DbGateway.addAsset({ symbol: 'usd', quantity: 500 })
      expect(DbGateway.assets).toEqual([{ symbol: 'usd', quantity: 500 }])
    })
    it('should add to balance', () => {
      initializeTest()
      DbGateway.addAsset({ symbol: 'usd', quantity: 500 })
      DbGateway.addAsset({ symbol: 'usd', quantity: 500 })
      expect(DbGateway.assets).toEqual([{ symbol: 'usd', quantity: 1000 }])
    })
    it('should add to balance', () => {
      initializeTest()
      DbGateway.addAsset({ symbol: 'btc', quantity: 500 })
      expect(DbGateway.assets).toEqual([
        { symbol: 'usd', quantity: 0 },
        { symbol: 'btc', quantity: 500 }
      ])
    })
  })

  describe('removeAsset', () => {
    it('should remove from balance', () => {
      initializeTest()
      DbGateway.removeAsset({ symbol: 'usd', quantity: 500 })
      expect(DbGateway.assets).toEqual([{ symbol: 'usd', quantity: -500 }])
    })
  })

  describe('openPosition', () => {
    it('should add new openPosition and update assets', () => {
      initializeTest([{ symbol: 'usd', quantity: 1000 }])

      const newPosition = {
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      }
      DbGateway.openPosition(newPosition)
      expect(DbGateway.assets).toEqual([
        { symbol: 'usd', quantity: 500 },
        { symbol: 'btc', quantity: 0.05 }
      ])
      expect(DbGateway.openPositions).toEqual([
        { ...newPosition, id: 'trade_1' }
      ])
    })

    it('should add asset to already existing position', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      const openPositions = [
        {
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.05,
          buyingPrice: 10000
        }
      ]
      initializeTest(assets, openPositions)

      const addedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      }
      DbGateway.openPosition(addedPosition)
      expect(DbGateway.assets).toEqual([
        { symbol: 'usd', quantity: 0 },
        { symbol: 'btc', quantity: 0.1 }
      ])
      expect(DbGateway.openPositions).toEqual([
        {
          id: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.1,
          buyingPrice: 10000
        }
      ])
    })
  })

  describe('closePosition', () => {
    it('should close position and update assets', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      initializeTest(assets)
      DbGateway.openPosition({
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      })

      const closedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        sellingPrice: 12000
      }
      DbGateway.closePosition(closedPosition)

      expect(DbGateway.assets).toEqual([
        { symbol: 'usd', quantity: 1100 },
        { symbol: 'btc', quantity: 0 }
      ])
      expect(DbGateway.openPositions).toEqual([])
      expect(DbGateway.closedPositions).toEqual([
        {
          id: 'trade_2',
          originalTradeId: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.05,
          buyingPrice: 10000,
          sellingPrice: 12000
        }
      ])
    })
    it('should partially close position and update assets', () => {
      const assets = [{ symbol: 'usd', quantity: 1000 }]
      initializeTest(assets)
      DbGateway.openPosition({
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.05,
        buyingPrice: 10000
      })

      const closedPosition = {
        id: 'trade_1',
        pair: { base: 'btc', quote: 'usd' },
        quantity: 0.01,
        sellingPrice: 14000
      }
      DbGateway.closePosition(closedPosition)

      expect(DbGateway.assets).toEqual([
        { symbol: 'usd', quantity: 640 },
        { symbol: 'btc', quantity: 0.04 }
      ])
      expect(DbGateway.openPositions).toEqual([
        {
          id: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.04,
          buyingPrice: 10000
        }
      ])
      expect(DbGateway.closedPositions).toEqual([
        {
          id: 'trade_2',
          originalTradeId: 'trade_1',
          pair: { base: 'btc', quote: 'usd' },
          quantity: 0.01,
          buyingPrice: 10000,
          sellingPrice: 14000
        }
      ])
    })
  })

  const initializeTest = (assets = [], positionsToOpen = []) => {
    DbGateway = new InMemoryDbGateway()
    assets.forEach(a => DbGateway.addAsset(a))
    positionsToOpen.forEach(p => DbGateway.openPosition(p))
  }
})
