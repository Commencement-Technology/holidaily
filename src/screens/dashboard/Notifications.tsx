import React, { useCallback, useEffect } from 'react'
import { Box, Text, useTheme } from 'utils/theme'
import { TouchableOpacity } from 'react-native'
import { SafeAreaWrapper } from 'components/SafeAreaWrapper'
import IconBack from 'assets/icons/icon-back2.svg'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LoadingModal } from 'components/LoadingModal'
import { useFetchNotifications } from 'dataAccess/queries/useFetchNotifications'
import { useBackHandler } from 'hooks/useBackHandler'
import { AppNavigationType } from 'navigation/types'
import { GestureRecognizer } from 'utils/GestureRecognizer'
import { isIos } from 'utils/layout'
import { NotificationsList } from './components/NotificationsList'

export const Notifications = () => {
  const theme = useTheme()
  const navigation = useNavigation<AppNavigationType<'NOTIFICATIONS'>>()
  const { t } = useTranslation('notifications')
  const { isLoading, data } = useFetchNotifications()

  const handleBack = useCallback(() => {
    navigation.navigate('DRAWER_NAVIGATOR', {
      screen: 'Home',
      params: {
        screen: 'DashboardNavigation',
      },
    })
  }, [navigation])

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'NAVIGATE') return
        e.preventDefault()
        handleBack()
      }),
    [handleBack, navigation]
  )

  useBackHandler(() => {
    handleBack()
    return true
  })

  return (
    <SafeAreaWrapper edges={['left', 'right']}>
      <Box
        paddingBottom="m"
        paddingTop={isIos ? 'xxlplus' : 'xlplus'}
        backgroundColor="veryLightGrey"
        borderBottomRightRadius="lmin"
        borderBottomLeftRadius="lmin"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingLeft="m">
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <IconBack height={16} width={10} color={theme.colors.black} />
        </TouchableOpacity>
        <Text variant="displayBoldSM" lineHeight={24}>
          {t('header')}
        </Text>
        <Box paddingRight="l" />
      </Box>
      <GestureRecognizer
        androidOnly
        onSwipeRight={handleBack}
        style={{
          alignItems: 'flex-end',
          paddingHorizontal: theme.spacing.xm,
        }}>
        {data?.notifications && <NotificationsList data={data.notifications} />}
      </GestureRecognizer>
      <LoadingModal show={isLoading} />
    </SafeAreaWrapper>
  )
}
