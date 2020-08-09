import { SortItem, SortComparator } from ".";

import { CancellationToken, DelayToken } from "../util/tokens";
import { sleep } from "../util/sleep";

function swap(array: SortItem[], indexA: number, indexB: number) {
  var temp = array[indexA];
  array[indexA] = array[indexB];
  array[indexB] = temp;
}

async function partition(
  array: SortItem[],
  pivot: number,
  left: number,
  right: number,
  comparator: SortComparator,
  delayToken: DelayToken,
  stoppingToken: CancellationToken
) {
  if (stoppingToken.cancelRequested) return;
  var storeIndex = left,
    pivotValue = array[pivot];
  swap(array, pivot, right);
  for (var v = left; v < right; v++) {
    if (stoppingToken.cancelRequested) break;
    array[v].active = true;
    array[storeIndex].active = true;
    await sleep(delayToken.delay);

    if (
      comparator(pivotValue, array[v]) &&
      pivotValue.value !== array[v].value
    ) {
      array[v].swapping = true;
      array[storeIndex].swapping = true;
      await sleep(delayToken.delay);
      swap(array, v, storeIndex);
      array[v].swapping = false;
      array[storeIndex].swapping = false;
      await sleep(delayToken.delay);
      array[storeIndex].active = false;
      storeIndex++;
    }
    array[v].active = false;
    array[storeIndex].active = false;
  }

  swap(array, right, storeIndex);
  return storeIndex;
}

async function sort(
  array: SortItem[],
  left: number,
  right: number,
  comparator: SortComparator,
  delayToken: DelayToken,
  stoppingToken: CancellationToken
) {
  var pivot = null;

  if (typeof left !== "number") {
    left = 0;
  }

  if (typeof right !== "number") {
    right = array.length - 1;
  }

  if (left < right) {
    pivot = left + Math.ceil((right - left) * 0.5);
    array[pivot].pivot = true;
    var newPivot = await partition(
      array,
      pivot,
      left,
      right,
      comparator,
      delayToken,
      stoppingToken
    );

    await sort(
      array,
      left,
      newPivot - 1,
      comparator,
      delayToken,
      stoppingToken
    );
    await sort(
      array,
      newPivot + 1,
      right,
      comparator,
      delayToken,
      stoppingToken
    );
    array.forEach(async (q) => (q.pivot = false));
  }
}

export async function quickSort(
  data: SortItem[],
  comparator: SortComparator,
  delay: DelayToken,
  stoppingToken: CancellationToken
) {
  await sort(data, undefined, undefined, comparator, delay, stoppingToken);
}
