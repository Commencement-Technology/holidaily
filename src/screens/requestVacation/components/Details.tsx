import { FormInput } from 'components/FormInput'
import React, { useEffect } from 'react'
import { BaseOpacity, Box, useTheme } from 'utils/theme'
import { AppNavigationType } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { getFormattedPeriod } from 'utils/dates'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CustomInput } from 'components/CustomInput'
import CalendarIcon from 'assets/icons/icon-calendar.svg'
import { useBooleanState } from 'hooks/useBooleanState'
import { useRequestVacationContext } from '../contexts/RequestVacationContext'

type DetailsProps = {
  date: {
    start?: Date
    end?: Date
  }
  onDescriptionChange: F1<string>
}

export const Details = (p: DetailsProps) => {
  const navigation = useNavigation<AppNavigationType<'REQUEST_VACATION'>>()
  const { control, register, errors } = useForm()
  const { sickTime, isPeriodInvalid, requestData, isFormEmpty, startDate } =
    useRequestVacationContext()
  const [isInputError, { setTrue: triggerInputError, setFalse: dismissInputError }] =
    useBooleanState(false)
  const { t } = useTranslation('requestVacation')
  const theme = useTheme()

  useEffect(() => {
    if (isFormEmpty) triggerInputError()
    if (startDate) dismissInputError()
  }, [dismissInputError, isFormEmpty, startDate, triggerInputError])

  useEffect(() => {
    register('description', { required: false })
  }, [register])

  const handleNavigate = () =>
    navigation.navigate('REQUEST_VACATION_CALENDAR', { isSickTime: sickTime })

  return (
    <Box>
      <Box marginTop="m">
        <BaseOpacity
          position="absolute"
          activeOpacity={0.8}
          onPress={handleNavigate}
          backgroundColor="transparent"
          width="100%"
          height={60}
          zIndex="10"
        />
        <CustomInput
          focusable={false}
          disabled
          placeholder={t('selectDate')}
          inputLabel={t('detailsDate')}
          isError={isInputError || isPeriodInvalid}
          variant="medium"
          value={getFormattedPeriod(p.date.start, p.date.end)}
        />
        <Box position="absolute" right={theme.spacing.m} top={theme.spacing.lplus}>
          <CalendarIcon color={theme.colors.headerGrey} />
        </Box>
      </Box>
      <Box marginTop="m">
        <FormInput
          variant="medium"
          control={control}
          isError={!errors}
          errors={errors}
          name="description"
          inputLabel={t('detailsDescription')}
          placeholder={t('setDescription')}
          validationPattern={/$/}
          errorMessage={t('detailsDescriptionError')}
          keyboardType="default"
          autoComplete="off"
          onChange={(e) => p.onDescriptionChange(e.nativeEvent.text)}
          reset={() => p.onDescriptionChange('')}
          maxLength={300}
          value={requestData.description}
        />
      </Box>
    </Box>
  )
}
