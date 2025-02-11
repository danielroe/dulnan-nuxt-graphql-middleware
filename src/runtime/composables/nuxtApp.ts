import type { FetchOptions } from 'ofetch'
import { useGraphqlState } from './useGraphqlState'
import { GraphqlResponse, getEndpoint } from './shared'

export function performRequest(
  operation: string,
  operationName: string,
  method: 'get' | 'post',
  options: FetchOptions,
) {
  const state = useGraphqlState()
  return $fetch<GraphqlResponse<any>>(getEndpoint(operation, operationName), {
    ...(state && state.fetchOptions ? state.fetchOptions : {}),
    ...options,
    method,
  }).then((v) => {
    return {
      data: v.data,
      errors: v.errors || [],
    }
  })
}
