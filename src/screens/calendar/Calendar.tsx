import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, mkUseStyles, Text } from 'utils/theme'
import { EventsList } from 'screens/calendar/components/EventsList'
import { SafeAreaWrapper } from 'components/SafeAreaWrapper'
import { useCalendarData } from 'screens/calendar/useCalendarData'
import { DrawerActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { CalendarNavigatorType, CalendarRoutes } from 'navigation/types'
import { PrevScreen, usePrevScreenBackHandler } from 'hooks/usePrevScreenBackHandler'
import { useUserSettingsContext } from 'hooks/context-hooks/useUserSettingsContext'
import { useTranslation } from 'react-i18next'
import CloseIcon from 'assets/icons/icon-close.svg'
import AcceptIcon from 'assets/icons/icon-accept.svg'
import SwipeDown from 'assets/icons/icon-swipe-down.svg'
import { PanGestureHandler } from 'react-native-gesture-handler'
import { DayInfoProps } from 'types/DayInfoProps'
import {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useCalendarContext } from 'hooks/context-hooks/useCalendarContext'
import { useBooleanState } from 'hooks/useBooleanState'
import { useGetNotificationsConfig } from 'utils/notifications/notificationsConfig'
import { useMemoizedNonNullValue } from 'hooks/memoization/useMemoizedNonNullValue'
import { GestureRecognizer } from 'utils/GestureRecognizer'
import { AnimatedBox } from 'components/AnimatedBox'
import { FlashList } from '@shopify/flash-list'
import { LoadingModal } from 'components/LoadingModal'
import { getISODateString } from 'utils/dates'
import { Keyboard, TouchableWithoutFeedback } from 'react-native'
import { CalendarButton } from './components/CalendarButton'
import { DayEvent, DayOffEvent } from './components/DayEvent'
import { CategoriesSlider } from './components/CategoriesSlider'
import { getDaysInMonth, getSlicedDate } from './utils'
import { DateInputs } from './components/DateInputs'
import { useTeamCategories } from './useTeamCategories'

const date = new Date()
const today = date.toISOString().split('T')[0]

const isEndDateLowerThanStartDate = (startDate: string, endDate: string) => {
  const startTimestamp = new Date(startDate).getTime()
  const endTimestamp = new Date(endDate).getTime()

  return endTimestamp < startTimestamp
}

const springConfig = {
  damping: 6,
  stiffness: 288,
  mass: 0.7,
}

type NavigationType = CalendarNavigatorType<'CALENDAR'> & typeof DrawerActions

export const Calendar = () => {
  const { t } = useTranslation('calendar')
  const navigation = useNavigation<NavigationType>()
  const flatListRef = useRef<FlashList<DayInfoProps>>(null)
  const { notify } = useGetNotificationsConfig()
  const styles = useStyles()
  const route = useRoute<RouteProp<CalendarRoutes, 'CALENDAR'>>()
  const [switchCalendarHeight, setSwitchCalendarHeight] = useState(true)
  const prevScreen: PrevScreen = route.params?.prevScreen
  const { userSettings, updateSettings } = useUserSettingsContext()
  const { filterCategories, toggleFilterItemSelection } = useTeamCategories()
  usePrevScreenBackHandler(prevScreen)

  const [inputErrors, setInputErrors] = useState({ startDateError: false, endDateError: false })

  const offset = useSharedValue(0)

  const [inputWasFocused, { setTrue: setInputWasFocused }] = useBooleanState(false)
  const [wasDateChangePressed, { setTrue: setWasDateChangePressed }] = useBooleanState(false)

  const { selectedDate, currentMonthDays, requestsDays } = useCalendarData()

  const { periodStart, periodEnd, handleSetPeriodStart, handleSetPeriodEnd } = useCalendarContext()

  const [slicedRequests, setSlicedRequest] = useState<DayInfoProps[]>([])

  const [singlePreviousEvent, setSinglePreviousEvent] = useState<DayOffEvent | null>(null)

  const disableSetDateButton = periodStart?.length < 9 && periodEnd?.length < 9

  const showEmptyState =
    (periodStart || periodEnd) &&
    wasDateChangePressed &&
    (slicedRequests.length === 0 || currentMonthDays.length === 0)

  const scrollToIndex = (index: number) =>
    flatListRef.current?.scrollToIndex({ index, animated: true })

  const isPeriodStartLowerThanRequestsDate = useMemo(() => {
    const periodStartTimestamp = new Date(periodStart)?.getTime()
    const firstRequestDayTimestamp = new Date(requestsDays?.[0]?.date)?.getTime()

    return periodStartTimestamp < firstRequestDayTimestamp
  }, [periodStart, requestsDays])

  const handleSetPreviousEvent = useCallback(
    (newPeriodStart?: string) => {
      const getPreviousEvent = () => {
        if (isPeriodStartLowerThanRequestsDate) return null

        const todayIndex = requestsDays.findIndex(
          (a) => a.date === newPeriodStart || a.date === periodStart || a.date === today
        )

        const reversedRequests = requestsDays.slice(0, todayIndex).reverse()
        const reversedRequestsWithEvents = reversedRequests.filter((a) => !!a?.events?.length)

        const event = reversedRequestsWithEvents[0]?.events?.[0]

        return event || null
      }

      const prevEvent = getPreviousEvent()

      if (singlePreviousEvent?.date !== prevEvent?.date) setSinglePreviousEvent(prevEvent)
    },
    [isPeriodStartLowerThanRequestsDate, periodStart, requestsDays, singlePreviousEvent?.date]
  )

  useEffect(() => {
    const pickedDate = userSettings?.pickedDate
    if (pickedDate) {
      if (pickedDate.startDate)
        handleSetPeriodStart(getISODateString(pickedDate.startDate.toISOString()))
      if (pickedDate.endDate) handleSetPeriodEnd(getISODateString(pickedDate.endDate.toISOString()))
    }

    handleSetPreviousEvent()
    // we want to set previous event only once, on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSetEventsInPeriod = (passedStartIndex?: number) => {
    const startDateItemIndex = passedStartIndex || 0

    if (!periodStart && !passedStartIndex) handleSetPeriodStart(today)

    const endDateItemIndex = requestsDays.findIndex((a) => a.date === periodEnd)

    const sliceEndIndex = endDateItemIndex === -1 ? requestsDays?.length : endDateItemIndex + 1

    const sliced = requestsDays.slice(startDateItemIndex, sliceEndIndex)

    setSlicedRequest(sliced)
  }

  const clearDatesInputs = () => {
    handleSetPeriodStart('')
    handleSetPeriodEnd(' ')
    setSlicedRequest([])
    handleSetPreviousEvent()
    Keyboard.dismiss()
    setInputErrors({ startDateError: false, endDateError: false })
  }

  useEffect(() => {
    if (slicedRequests.length > 0) scrollToIndex(0)
  }, [slicedRequests.length])

  const handleSwipeDown = () => {
    const dateToRevert = periodStart || today
    const { month: monthString, year: yearString, day: dayString } = getSlicedDate(dateToRevert)

    const year = Number(yearString)
    const month = Number(monthString)
    const day = Number(dayString)

    let newPeriodStart = ''

    let newDay

    if (day < 10) newDay = `0${day}`

    if (month === 1) {
      const { maxDay } = getDaysInMonth(year - 1, month)

      if (day > maxDay) newDay = maxDay

      newPeriodStart = `${year - 1}-12-${newDay || day}`

      handleSetPeriodStart(newPeriodStart)
    } else {
      const { maxDay } = getDaysInMonth(year, month - 1)

      if (day > maxDay) newDay = maxDay

      if (month > 10) newPeriodStart = `${year}-${month - 1}-${newDay || day}`
      else newPeriodStart = `${year}-0${month - 1}-${newDay || day}`

      handleSetPeriodStart(newPeriodStart)
    }

    const startDateItemIndex = requestsDays.findIndex((a) => a.date === newPeriodStart)

    handleSetEventsInPeriod(startDateItemIndex)
    handleSetPreviousEvent(newPeriodStart)
  }

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (event.translationY > 10) {
        offset.value = withSpring(100, springConfig, (finished) => {
          if (finished) offset.value = withSpring(0, springConfig)
        })
        runOnJS(handleSwipeDown)()
      }
    },
  })

  const adjustStartEndDates = () => {
    const { year: startYear, month: startMonth, day: startDay } = getSlicedDate(periodStart)
    const { year: endYear, month: endMonth, day: endDay } = getSlicedDate(periodEnd)

    let startDate = ''
    let endDate = ''

    if (periodStart && startDay) {
      if (startDay === '0') startDate = `${startYear}-${startMonth}-01`
      else if (startDay.length < 2) startDate = `${startYear}-${startMonth}-0${startDay}`
      else startDate = `${startYear}-${startMonth}-${startDay}`

      handleSetPeriodStart(startDate)
    }

    if (periodEnd && endDay) {
      if (endDay === '0') endDate = `${endYear}-${endMonth}-01`
      else if (endDay.length < 2) endDate = `${endYear}-${endMonth}-0${endDay}`
      else endDate = `${endYear}-${endMonth}-${endDay}`

      handleSetPeriodEnd(endDate)
    }

    return { startDate, endDate }
  }

  const handleSetDatePress = () => {
    const { startDate, endDate } = adjustStartEndDates()

    const notificationConfig = {
      params: { title: t('emptyStateNotificationTitle') },
      config: { duration: 5000 },
    }

    Keyboard.dismiss()

    if (isEndDateLowerThanStartDate(startDate, endDate)) {
      notify('infoCustom', notificationConfig)
      setWasDateChangePressed()
      return setSlicedRequest([])
    }

    const { year: startYear, month: startMonth, day: startDay } = getSlicedDate(periodStart)
    const { year: endYear, month: endMonth, day: endDay } = getSlicedDate(periodEnd)
    const actualYear = new Date().getFullYear()

    const isStartDateError =
      +startYear > 0 && (actualYear - +startYear > 3 || +startMonth > 12 || +startDay > 31)
    const isEndDateError =
      +endYear > 0 && (actualYear - +endYear < -3 || +endMonth > 12 || +endDay > 31)

    setInputErrors({ startDateError: isStartDateError, endDateError: isEndDateError })

    if (isStartDateError || isEndDateError) return

    let startIndex = 0

    if (!startDate) startIndex = requestsDays.findIndex((a) => a.date === today)
    else if (isPeriodStartLowerThanRequestsDate && !endDate) startIndex = 0
    else startIndex = requestsDays.findIndex((a) => a.date === startDate)

    if (startIndex === -1) {
      setSlicedRequest([])
      notify('infoCustom', notificationConfig)
    } else handleSetEventsInPeriod(startIndex)

    if (startDate) updateSettings({ pickedDate: { startDate: new Date(startDate) } })
    if (endDate) updateSettings({ pickedDate: { endDate: new Date(endDate) } })
    if (startDate && endDate)
      updateSettings({ pickedDate: { startDate: new Date(startDate), endDate: new Date(endDate) } })

    setWasDateChangePressed()
    handleSetPreviousEvent()
  }

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }))

  const memoizedPrevScreen = useMemoizedNonNullValue(prevScreen)

  const wasNavigatedFromNotifications = memoizedPrevScreen[0] === 'NOTIFICATIONS'

  useEffect(() => {
    const parent = navigation.getParent()?.getParent()

    if (wasNavigatedFromNotifications) parent?.setOptions({ swipeEnabled: false })
  }, [navigation, wasNavigatedFromNotifications])

  const handleSwipeRight = () => {
    if (wasNavigatedFromNotifications) navigation.navigate('NOTIFICATIONS')
    else navigation.openDrawer()
  }

  const getDaysFilteredByCategory = () => {
    const nonSelectedCategories = filterCategories?.map((a) => {
      if (!a.isSelected) return a.id

      return undefined
    })

    const days =
      !wasDateChangePressed && !slicedRequests?.length ? currentMonthDays : slicedRequests

    const requestsFilteredByCategory = days?.flatMap((a) => ({
      ...a,
      events: a?.events?.filter((c) => !nonSelectedCategories?.includes(c.categoryId)),
    }))

    return requestsFilteredByCategory || []
  }

  if (currentMonthDays.length < 1) return <LoadingModal show />

  return (
    <SafeAreaWrapper edges={['left', 'right', 'bottom', 'top']} isDefaultBgColor>
      <CategoriesSlider
        filterCategories={filterCategories}
        toggleFilterItemSelection={toggleFilterItemSelection}
      />

      <GestureRecognizer onSwipeRight={handleSwipeRight} iosOnly>
        <DateInputs
          onIconPress={() => navigation.navigate('CALENDAR_MODAL')}
          periodStart={periodStart}
          periodEnd={periodEnd}
          handleSetPeriodStart={handleSetPeriodStart}
          handleSetPeriodEnd={handleSetPeriodEnd}
          setInputWasFocused={setInputWasFocused}
          inputErrors={inputErrors}
        />
        {showEmptyState ? (
          <Box marginTop="xxxxl" alignItems="center">
            <Text variant="textMD">{t('emptyScreenTitle')}</Text>
            <Text marginTop="xs" variant="textXSGrey">
              {t('emptyScreenSubtitle')}
            </Text>
          </Box>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <Box
              backgroundColor="lightGrey"
              flex={1}
              borderRadius="l"
              marginTop={singlePreviousEvent ? 'xxxl' : 'l'}
              paddingTop="xxxl">
              <AnimatedBox flex={1} style={animatedStyles}>
                <Box paddingBottom="xm" justifyContent="center" alignItems="center">
                  <PanGestureHandler onGestureEvent={panGestureHandler}>
                    <AnimatedBox style={styles.swipeDownRecognizer}>
                      <Text variant="textXSGrey">{t('swipeDownToSeePrevious')}</Text>
                      <SwipeDown style={styles.swipeDownIcon} />
                    </AnimatedBox>
                  </PanGestureHandler>
                </Box>
                <EventsList
                  ref={flatListRef}
                  selectedDate={selectedDate}
                  days={getDaysFilteredByCategory()}
                  switchCalendarHeight={switchCalendarHeight}
                  setSwitchCalendarHeight={setSwitchCalendarHeight}
                />
              </AnimatedBox>
            </Box>
          </TouchableWithoutFeedback>
        )}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Box paddingHorizontal="s" position="absolute" top="14.5%" width="100%">
            <Box
              borderRadius="lmin"
              backgroundColor="calendarOlderEvents"
              paddingHorizontal="mlplus">
              {inputWasFocused || periodEnd || periodStart ? (
                <Box
                  flexDirection="row"
                  marginHorizontal="m"
                  position="absolute"
                  right={0}
                  top={5}
                  zIndex="2">
                  <CalendarButton onIconPress={clearDatesInputs}>
                    <CloseIcon color={styles.closeIcon.color} />
                  </CalendarButton>
                  <CalendarButton
                    onIconPress={handleSetDatePress}
                    type="blue"
                    disabled={disableSetDateButton}>
                    <AcceptIcon
                      color={
                        !disableSetDateButton
                          ? styles.acceptIcon.color
                          : styles.acceptIconDisabled.color
                      }
                    />
                  </CalendarButton>
                </Box>
              ) : null}
              <Box marginTop="m">
                <Text marginBottom="m" textTransform="uppercase" variant="textBoldXSGrey">
                  {slicedRequests.length > 0 ? t('selectedTimeframe') : t('dayOffCalendar')}
                </Text>
              </Box>
              {singlePreviousEvent ? (
                <Box opacity={showEmptyState ? 0 : 0.5} height={showEmptyState ? 0 : 'auto'}>
                  <DayEvent event={singlePreviousEvent} />
                </Box>
              ) : null}
            </Box>
          </Box>
        </TouchableWithoutFeedback>
      </GestureRecognizer>
    </SafeAreaWrapper>
  )
}

const useStyles = mkUseStyles((theme) => ({
  calendar: {
    width: 400,
    marginTop: theme.spacing.s,
  },
  swipeDownRecognizer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDownIcon: {
    marginLeft: theme.spacing.xxm,
    color: theme.colors.titleActive,
  },
  closeIcon: {
    color: theme.colors.headerGrey,
  },
  acceptIcon: {
    color: theme.colors.alwaysWhite,
  },
  acceptIconDisabled: {
    color: theme.colors.disabledAcceptIcon,
  },
}))
