
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';

import Preference from 'react-native-preference';
import {CommonActions} from '@react-navigation/native';

import OnBoardingScreen from './OnBoardingScreen';

const mockScrollBy = jest.fn();
const mockKillSwitchProperties = {
  binSetting: {isEnabled: false},
};

// Native preference storage
jest.mock('react-native-preference', () => ({
  __esModule: true,
  default: {
    set: jest.fn(),
  },
}));

// Navigation
jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    reset: jest.fn(config => ({
      type: 'RESET',
      payload: config,
    })),
  },
}));

// Translations
jest.mock('../../common/language/languageProvider', () => ({
  __esModule: true,
  default: class LanguageProvider {
    getText(key) {
      return key;
    }
  },
}));

// Kill-switch configuration
jest.mock('../../common/network/killSwitchCache', () => ({
  __esModule: true,
  default: class KillSwitchConfig {
    get moduleProperties() {
      return mockKillSwitchProperties;
    }
  },
}));

// Theme wrapper
jest.mock('../../common/components/Themeable', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: ({children}) =>
      React.createElement(View, null, children),
  };
});

// Icons
jest.mock('../../common/components/Icon', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: () => React.createElement(View),
  };
});

// Custom button
jest.mock('../../common/components/Button', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');

  return {
    __esModule: true,
    default: ({title, onPress}) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
  };
});

// Swiper mock
jest.mock('react-native-swiper', () => {
  const React = require('react');
  const {View} = require('react-native');

  return React.forwardRef(
    ({children, onIndexChanged}, ref) => {
      const [index, setIndex] = React.useState(0);

      React.useImperativeHandle(ref, () => ({
        scrollBy: amount => {
          mockScrollBy(amount);

          setIndex(current => {
            const next = Math.min(
              current + amount,
              React.Children.count(children) - 1,
            );

            onIndexChanged?.(next);
            return next;
          });
        },
      }));

      return (
        <View testID="onboarding-swiper">
          {React.Children.toArray(children)[index]}
        </View>
      );
    },
  );
});

describe('OnBoardingScreen', () => {
  const mockDispatch = jest.fn();

  const navigation = {
    dispatch: mockDispatch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockKillSwitchProperties.binSetting.isEnabled = false;
  });

  test('renders the first onboarding slide', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    expect(
      screen.getByText('welcome_screen'),
    ).toBeTruthy();

    expect(
      screen.getByText('welcome_screen_text'),
    ).toBeTruthy();
  });

  test('saves default unit on mount', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    expect(Preference.set).toHaveBeenCalledWith(
      'DEFAULT_UNIT',
      expect.anything(),
    );
  });

  test('moves to next slide when Next is pressed', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('NEXT'));

    expect(mockScrollBy).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(
        screen.getByText('explore_screen'),
      ).toBeTruthy();
    });
  });

  test('moves through all four slides', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));

    await waitFor(() => {
      expect(
        screen.getByText('learn_screen'),
      ).toBeTruthy();
    });
  });

  test('hides Skip on final slide', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));

    await waitFor(() => {
      expect(
        screen.queryByText('skip'),
      ).toBeNull();
    });
  });

  test('Skip completes onboarding', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('skip'));

    expect(Preference.set).toHaveBeenCalledWith(
      'FIRST_APP_LAUNCH',
      'true',
    );

    expect(CommonActions.reset).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('completing final slide saves preference', async () => {
    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));
    fireEvent.press(screen.getByText('NEXT'));

    // The final button uses the translation key
    // "next" in your implementation.
    fireEvent.press(screen.getByText('NEXT'));

    expect(Preference.set).toHaveBeenCalledWith(
      'FIRST_APP_LAUNCH',
      'true',
    );

    expect(mockDispatch).toHaveBeenCalled();
  });

  test('uses Bin Entry when bin setting is enabled', async () => {
    mockKillSwitchProperties.binSetting.isEnabled = true;

    await render(
      <OnBoardingScreen navigation={navigation} />,
    );

    fireEvent.press(screen.getByText('skip'));

    expect(CommonActions.reset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            name: expect.any(String),
          }),
        ],
      }),
    );
  });
});
