import { DynamicDrawUsage, InstancedBufferAttribute, InstancedInterleavedBuffer, InterleavedBufferAttribute } from 'three'
import type { TypedArray } from 'three'

export function createDynamicFloat32InstancedAttribute(
  itemSize: number,
  elementCount: number,
  previous?: InstancedBufferAttribute,
) {
  const array = new Float32Array(elementCount * itemSize)
  if (previous != null) {
    array.set(previous.array.subarray(0, array.length))
  }
  const attribute = new InstancedBufferAttribute(array, itemSize, false)
  attribute.setUsage(DynamicDrawUsage)
  return attribute
}

export function copyWithinInstancedAttribute(
  attribute: InstancedBufferAttribute,
  targetIndex: number,
  startIndex: number,
  endIndex: number,
) {
  const itemSize = attribute.itemSize
  const start = startIndex * itemSize
  const end = endIndex * itemSize
  const target = targetIndex * itemSize
  attribute.array.copyWithin(target, start, end)
  const count = end - start
  attribute.addUpdateRange(start, count)
  attribute.addUpdateRange(target, count)
  attribute.needsUpdate = true
}

export function copyInstancedArrayRange(
  target: number,
  start: number,
  end: number,
  from: TypedArray,
  to: TypedArray,
  itemSize: number,
): void {
  if (start === end) {
    return
  }
  const targetIndex = target * itemSize
  const startIndex = start * itemSize
  const endIndex = end * itemSize
  to.set(from.subarray(startIndex, endIndex), targetIndex)
}

export function setInstancedMatrixColumns(
  target: Record<string, InstancedBufferAttribute | InterleavedBufferAttribute>,
  prefix: string,
  attribute: InstancedBufferAttribute,
) {
  const interleaved = new InstancedInterleavedBuffer(attribute.array, 16, attribute.meshPerAttribute)
  for (let i = 0; i < 4; i++) {
    target[`${prefix}${i}`] = new InterleavedBufferAttribute(interleaved, 4, i * 4, attribute.normalized)
  }
}
