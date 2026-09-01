import { readJson } from './json-store.js'
import { validateRegionalData } from './validate.js'

export class DataRepository {
  constructor(outputFile) {
    this.outputFile = outputFile
    this.current = null
  }

  async load() {
    this.current = validateRegionalData(await readJson(this.outputFile))
    return this.current
  }

  get() {
    if (!this.current) throw new Error('Regional access data is unavailable')
    return this.current
  }
}
