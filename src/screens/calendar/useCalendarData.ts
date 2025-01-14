import { useEffect, useMemo, useState } from 'react'
import { getISODateString, parseISO } from 'utils/dates'
import { useRequestsContext } from 'hooks/context-hooks/useRequestsContext'
import { HolidayRequestMonthType } from 'types/HolidayRequestMonthType'
import { eachDayOfInterval, lastDayOfMonth } from 'date-fns'
import { DayInfoProps } from 'types/DayInfoProps'
import { useTeamCategories } from './useTeamCategories'

export const useCalendarData = () => {
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date())
  const [currentMonthDays, setCurrentMonthDays] = useState<DayInfoProps[]>([])
  const { filterCategories, toggleFilterItemSelection } = useTeamCategories()
  const { requests } = useRequestsContext()

  const convertToLocalDate = (date: string) => {
    const dateToConvert = new Date(date)
    const localDate = new Date()
    dateToConvert.setHours(dateToConvert.getHours() - localDate.getTimezoneOffset() / 60)
    return dateToConvert
  }

  const setSelectedDate = (date: Date) => {
    const localDate = convertToLocalDate(getISODateString(date))
    setSelectedDateState(localDate)
  }

  useEffect(() => {
    let currentMonthRequests = requests.find((month) => {
      const thisMonth = parseISO(month.date)
      return (
        thisMonth.getMonth() === selectedDate.getMonth() &&
        thisMonth.getFullYear() === selectedDate.getFullYear()
      )
    })

    if (!currentMonthRequests) {
      const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)

      const eachDayOfMonth = eachDayOfInterval({
        start: new Date(firstDayOfMonth),
        end: new Date(lastDayOfMonth(firstDayOfMonth)),
      })

      currentMonthRequests = {
        date: selectedDate.toISOString(),
        days: eachDayOfMonth.map((day) => ({ date: getISODateString(day) })),
      }
    }
    const singleMonthRequests: HolidayRequestMonthType = {
      date: currentMonthRequests.date,
      days: currentMonthRequests.days,
    }

    if (singleMonthRequests) {
      const newCurrentMonthDays = singleMonthRequests.days.map((day) => {
        if (day.weekend || !day.events) return day
        return {
          ...day,
          events: day.events.filter(
            (event) =>
              filterCategories?.find((category) => category.id === event.categoryId)?.isSelected
          ),
        }
      })

      const currentDay = selectedDate.getDate() - 1
      setCurrentMonthDays(newCurrentMonthDays.slice(currentDay))
    } else setCurrentMonthDays([])
  }, [filterCategories, requests, selectedDate])

  const sortedRequests = useMemo(
    () => requests?.sort((a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime()),
    [requests]
  )

  const requestsDays = sortedRequests.flatMap((a) => a?.days?.map((b) => b))

  return {
    selectedDate,
    setSelectedDate,
    currentMonthDays,
    requestsDays,
    toggleFilterItemSelection,
  }
}
