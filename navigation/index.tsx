import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';

import SignIn from '../screens/auth/signin';
import SignUp from '../screens/auth/signup';
import VerifyEmailScreen from '../screens/auth/verifyEmail';
import OnboardingScreen from '../screens/auth/onboarding';

import Main from '../screens/app/main';
import MyTripsScreen from '../screens/app/myTrips';
import Timetable from '../screens/app/timetable';
import AppSettings from '../screens/app/settings';
import UserPreferences from '../screens/app/userPreferences';
import RideDetails from '../screens/app/rideDetails';
import LiftRequestDetails from '../screens/app/liftRequestDetails';

const AuthStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    SignIn: { screen: SignIn },
    SignUp: { screen: SignUp },
  },
});
const AuthNavigation = createStaticNavigation(AuthStack);

const VerifyStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    VerifyEmail: { screen: VerifyEmailScreen },
  },
});
const VerifyNavigation = createStaticNavigation(VerifyStack);

const OnboardingStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Onboarding: { screen: OnboardingScreen },
  },
});
const OnboardingNavigation = createStaticNavigation(OnboardingStack);

const Tabs = createBottomTabNavigator({
  screenOptions: ({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ color, size }) => {
      const name =
        route.name === 'Main'
          ? 'home'
          : route.name === 'MyTrips'
          ? 'car'
          : route.name === 'UserPreferences'
          ? 'person'
          : 'settings';

      return <Ionicons name={name as any} size={size} color={color} />;
    },
  }),
  screens: {
    Main: { screen: Main, options: { title: 'Explore' } },
    MyTrips: { screen: MyTripsScreen, options: { title: 'My Trips' } },
    UserPreferences: { screen: UserPreferences, options: { title: 'Profile' } },
  },
});

const AppStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Tabs: { screen: Tabs },
    RideDetails: { screen: RideDetails },
    LiftRequestDetails: { screen: LiftRequestDetails },
  },
});

const AppNavigation = createStaticNavigation(AppStack);

type RootNavigatorParamList = StaticParamList<typeof AuthStack>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootNavigatorParamList {}
  }
}

export default function RootNavigation(props: any){
  const { user, initializing, profileCompleted} = useAuthStore();

  if (initializing){
    return null;
  }

  if (!user) return <AuthNavigation {...props} />;

  console.log('User email verified:', user.emailVerified, 'Profile completed:', profileCompleted);
  if (!user.emailVerified) return <VerifyNavigation {...props} />;

  if (profileCompleted === false) return <OnboardingNavigation {...props} />;

  if (profileCompleted === null) return null;
  
  return <AppNavigation {...props} />;
};
