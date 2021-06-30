import React from 'react'
import { Box, Text } from 'utils/theme'
import { getDateWithMonthString } from 'utils/dates'
import { useTranslation } from 'react-i18next'
import { DayWeekend } from './DayWeekend'
import { DayEvent, DayOffEvent } from './DayEvent'

export type DayInfoProps = {
  date: string
  events?: DayOffEvent[]
  weekend?: number
}

export const DayInfo = ({ date, events, weekend }: DayInfoProps) => {
  const { i18n } = useTranslation()

  if (weekend) return <DayWeekend date={date} weekend={weekend} />
  return (
    <Box
      borderRadius="lmin"
      backgroundColor="white"
      paddingVertical="m"
      paddingHorizontal="lplus"
      marginVertical="s">
      <Text variant="captionText">{getDateWithMonthString(date, i18n.language)}</Text>
      {typeof events !== 'undefined' && events?.length > 0 && (
        <Box marginTop="s">
          {events.map((event) => (
            <DayEvent event={event} key={event.id} />
          ))}
        </Box>
      )}
    </Box>
  )
}