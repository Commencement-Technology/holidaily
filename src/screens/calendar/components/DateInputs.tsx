import React from 'react'
import { Box, theme } from 'utils/theme'
import CalendarIcon from 'assets/icons/icon-calendar.svg'
import { MaskedInput } from 'components/MaskedInput'
import { useTranslation } from 'react-i18next'
import { CalendarButton } from './CalendarButton'
import { getDaysInMonth, getSlicedDate } from '../utils'

const mask = [/\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/]

interface Props {
  onIconPress: F0
  periodStart: string
  handleSetPeriodStart: F1<string>
  periodEnd: string
  handleSetPeriodEnd: F1<string>
  setInputWasFocused: F0
  inputErrors: { startDateError: boolean; endDateError: boolean }
}

const handleOnChangeSwitch = (e: string, setDate: any) => {
  const { year, month, day } = getSlicedDate(e)

  const yearNumber = Number(year) || 0
  const monthNumber = Number(month) || 0

  const { firstDayNumber, secondDayNumber } = getDaysInMonth(yearNumber, monthNumber)

  const monthFirstNumber = Number(month[0])
  const dayFirstNumberInInput = Number(day[0])

  switch (e.length) {
    case 1:
      if (Number(e) !== 2) setDate('2')
      else setDate(e)

      break
    case 2:
      if (Number(e) !== 0) setDate(`${e.slice(0, 1)}0`)
      else setDate(e)

      break
    case 5:
      if (Number(e.slice(4)) > 1) setDate(`${e.slice(0, 4)}1`)
      else setDate(e)

      break
    case 6:
      if (Number(e.slice(5)) > 1) setDate(`${e.slice(0, 4)}1`)
      else setDate(e)

      break
    case 7:
      if (Number(e.slice(6)) > 2 && monthFirstNumber > 0) setDate(`${e.slice(0, 6)}2`)
      else if (Number(e.slice(6)) === 0) setDate(`${e.slice(0, 6)}1`)
      else setDate(e)

      break

    case 9:
      if (Number(e.slice(8)) > firstDayNumber) setDate(`${e.slice(0, 7)}${firstDayNumber}`)
      else setDate(e)

      break

    case 10:
      if (dayFirstNumberInInput === firstDayNumber && Number(e.slice(9)) > secondDayNumber)
        setDate(`${e.slice(0, 9)}${secondDayNumber}`)
      else setDate(e)

      break

    default:
      setDate(e)
  }
}

export const DateInputs = (p: Props) => {
  const { t } = useTranslation('calendar')

  const handleOnChange = (type: 'from' | 'to') => (e: string) => {
    if (type === 'from') handleOnChangeSwitch(e, p.handleSetPeriodStart)
    else handleOnChangeSwitch(e, p.handleSetPeriodEnd)
  }

  const handleReset = (type: 'from' | 'to') => {
    handleOnChange(type)('')
  }

  return (
    <Box
      flexDirection="row"
      marginTop="xxs"
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="m">
      <Box flex={1} height={69}>
        <MaskedInput
          handleOnChange={handleOnChange('from')}
          value={p.periodStart}
          mask={mask}
          maxLength={10}
          placeholder={t('dateInputPlaceholder')}
          keyboardType="number-pad"
          obfuscationCharacter="-"
          showObfuscatedValue
          reset={() => handleReset('from')}
          isError={p.inputErrors.startDateError}
          inputLabel={t('dateFrom')}
        />
      </Box>

      <Box flex={1} marginLeft="xmm" height={69}>
        <MaskedInput
          handleOnChange={handleOnChange('to')}
          value={p.periodEnd}
          mask={mask}
          maxLength={10}
          placeholder={t('dateInputPlaceholder')}
          keyboardType="number-pad"
          obfuscationCharacter="-"
          showObfuscatedValue
          reset={() => handleReset('to')}
          isError={p.inputErrors.endDateError}
          inputLabel={t('dateTo')}
        />
      </Box>
      <Box paddingTop="m" height={69} marginBottom="-m">
        <CalendarButton onIconPress={p.onIconPress}>
          <CalendarIcon color={theme.colors.headerGrey} />
        </CalendarButton>
      </Box>
    </Box>
  )
}
