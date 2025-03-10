import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import { Box, Text } from 'utils/theme'
import { isSmallScreen, windowHeight } from 'utils/deviceSizes'
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { isAndroid } from 'react-native-calendars/src/expandableCalendar/commons'
import FastImage, { Source } from 'react-native-fast-image'
import { AnimatedBox } from './AnimatedBox'

const { width } = Dimensions.get('window')

type SliderContentProps = {
  title: string
  text: string
  image: Source
  isUserLoggedIn: boolean
  disableInitialAnimation?: boolean
}

const IMAGE_HEIGHT = 300
const iconPosition = isAndroid ? 3 : 1.7
const middleScreenY = windowHeight / 2 - IMAGE_HEIGHT / iconPosition

const imgStyles = {
  height: IMAGE_HEIGHT,
  width: '100%',
}

export const SliderContent = ({
  title,
  text,
  image,
  isUserLoggedIn,
  disableInitialAnimation,
}: SliderContentProps) => {
  const translateY = useSharedValue(middleScreenY)
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const rotate = useSharedValue(0)
  const opacityStyles = useAnimatedStyle(() => ({ opacity: opacity.value }), [])
  const imageStyles = useAnimatedStyle(
    () => ({
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    }),
    []
  )

  useEffect(() => {
    if (disableInitialAnimation) {
      translateY.value = withTiming(middleScreenY)
      scale.value = withTiming(1)
      translateY.value = withSpring(0)
      opacity.value = withTiming(1)
      return
    }
    const rotateCount = isUserLoggedIn ? -1 : 6
    scale.value = withDelay(200, withSpring(0.6))
    rotate.value = withDelay(700, withRepeat(withTiming(-25, { duration: 580 }), rotateCount, true))
    const longAnimation = () => {
      translateY.value = withDelay(2600, withTiming(middleScreenY))
      scale.value = withDelay(3000, withSpring(1))
      translateY.value = withDelay(3000, withSpring(0))
      opacity.value = withDelay(3600, withTiming(1, { duration: 300 }))
    }
    if (!isUserLoggedIn) longAnimation()
  }, [disableInitialAnimation, isUserLoggedIn, opacity, rotate, scale, translateY])

  return (
    <Box width={width} alignItems="center" justifyContent="space-around">
      <AnimatedBox
        style={imageStyles}
        justifyContent="center"
        alignItems="center"
        aspectRatio={isSmallScreen ? 1.4 : 1}
        width="100%"
        backgroundColor="primary"
        marginTop="-ml"
        marginBottom="-ml">
        <FastImage style={imgStyles} source={image} resizeMode="contain" />
      </AnimatedBox>
      <AnimatedBox style={opacityStyles} maxWidth="80%" justifyContent="center" alignItems="center">
        <Text variant="title1" paddingBottom="m" color="alwaysBlack">
          {title}
        </Text>
        <Text variant="body1" color="alwaysBlack">
          {text}
        </Text>
      </AnimatedBox>
    </Box>
  )
}
