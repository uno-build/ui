import { signal } from '@preact/signals-core'
import Yoga, { ExperimentalFeature } from 'yoga-layout/sync'
import type { Node, Yoga as YogaType } from 'yoga-layout/sync'

export const PointScaleFactor = 100

export function createDefaultConfig(Config: YogaType['Config']) {
  const config = Config.create()
  config.setUseWebDefaults(true)
  config.setPointScaleFactor(PointScaleFactor)
  config.setExperimentalFeatureEnabled(ExperimentalFeature.WebFlexBasis, true)
  return config
}

const yogaRuntime = (
  'Config' in Yoga ? Yoga : (Yoga as unknown as { default: YogaType }).default
)

const config = createDefaultConfig(yogaRuntime.Config)
const create = signal<(() => Node) | undefined>(() => yogaRuntime.Node.create(config))

export const createYogaNode = () => create.value?.()
