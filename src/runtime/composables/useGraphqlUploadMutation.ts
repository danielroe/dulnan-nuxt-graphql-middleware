import {
  type GraphqlMiddlewareMutationName,
  type GetMutationArgs,
  type MutationObjectArgs,
  type GetMutationResult,
  getEndpoint,
} from './shared'
import type { GraphqlMiddlewareMutation } from '#build/nuxt-graphql-middleware'
import { useGraphqlState } from '#imports'

/**
 * Builds the form data.
 */
function createFormData(variables: Record<string, any>): FormData {
  const formData = new FormData()
  formData.append('operations', '{}')
  const map: Record<string, string[]> = {}
  let fileIndex = 0

  // Iterate over the variables and collect the files.
  const traverseAndBuildMap = (obj: any, path: string): any => {
    if (obj instanceof File) {
      const fileKey = `${fileIndex++}`
      map[fileKey] = [path]
      formData.append(fileKey, obj)
      return null // Replace File with null for JSON.stringify
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) =>
        traverseAndBuildMap(item, `${path}.${index}`),
      )
    }

    if (typeof obj === 'object' && obj !== null) {
      const newObj: Record<string, any> = {}
      for (const key in obj) {
        newObj[key] = traverseAndBuildMap(obj[key], `${path}.${key}`)
      }
      return newObj
    }

    return obj
  }

  const cleanedVariables = traverseAndBuildMap(variables, 'variables')

  formData.append('variables', JSON.stringify(cleanedVariables))
  formData.append('map', JSON.stringify(map))

  return formData
}

/**
 * Performs a GraphQL upload mutation.
 */
export function useGraphqlUploadMutation<
  T extends GraphqlMiddlewareMutationName,
>(
  ...args:
    | GetMutationArgs<T, GraphqlMiddlewareMutation>
    | [MutationObjectArgs<T, GraphqlMiddlewareMutation>]
): Promise<GetMutationResult<T, GraphqlMiddlewareMutation>> {
  const [name, variables, fetchOptions = {}] =
    typeof args[0] === 'string'
      ? [args[0], args[1]]
      : [args[0].name, args[0].variables, args[0].fetchOptions]

  if (!variables) {
    throw new Error(
      'Using "useGraphqlUploadMutation" without variables is not supported.',
    )
  }

  const state = useGraphqlState()

  const formData = createFormData(variables)

  return $fetch<GetMutationResult<T, GraphqlMiddlewareMutation>>(
    getEndpoint('upload', name),
    {
      ...(state && state.fetchOptions ? state.fetchOptions : {}),
      ...(fetchOptions || {}),
      method: 'POST',
      body: formData,
    },
  ).then((v) => {
    return {
      ...v,
      data: v?.data,
      errors: v?.errors || [],
    }
  })
}
