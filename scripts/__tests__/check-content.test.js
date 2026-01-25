const fs = require('fs')

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('check-content main', () => {
  it('exits with code 1 when index is missing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const { main } = require('../check-content')
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error('exited ' + code) })
    expect(() => main()).toThrow('exited 1')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('exits with code 1 when index empty', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('[]')
    const { main } = require('../check-content')
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error('exited ' + code) })
    expect(() => main()).toThrow('exited 1')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('prints success when index has posts', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('[{}]')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { main } = require('../check-content')
    main()
    expect(log).toHaveBeenCalledWith('Content check passed: 1 posts')
  })
})