import { useMutation } from 'react-query'
import axios, { AxiosError } from 'axios'
import { DayOffRequest } from 'mock-api/models'
import { useUserContext } from 'hooks/useUserContext'
import { API } from '../API'

export type PostDayOffRequestBody = Pick<
  DayOffRequest,
  'description' | 'endDate' | 'isSickTime' | 'message' | 'startDate' | 'attachments'
>
export type PostDayOffRequestSuccess = { request: DayOffRequest }

const createDayOffRequest = async (
  body: PostDayOffRequestBody
): Promise<PostDayOffRequestSuccess> => {
  const { data } = await axios.post<PostDayOffRequestSuccess>(API.POST.createDayOff, body)
  return data
}
export const useCreateDayOffRequest = () => {
  const { updateUser, user } = useUserContext()
  return useMutation<
    PostDayOffRequestSuccess,
    AxiosError<{ errors: string[] }>,
    PostDayOffRequestBody
  >(createDayOffRequest, {
    onSuccess: (payload) => {
      const oldRequests = user?.requests ?? []
      updateUser({ requests: [...oldRequests, payload.request] })
    },
    onError: (err) => {
      console.error('Error while posting day off request: ', err.message)
      if (err.isAxiosError) console.error(err.response?.data)
    },
  })
}