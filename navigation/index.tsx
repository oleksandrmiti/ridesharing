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
import Timetable from '../screens/app/timetable';
import AppSettings from '../screens/app/settings';
import UserPreferences from '../screens/app/userPreferences';
import RideDetails from '../screens/app/rideDetails';

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

const MainStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    MainHome: { screen: Main },
    RideDetails: { screen: RideDetails },
  },
});

const Tabs = createBottomTabNavigator({
  screenOptions: ({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ color, size }) => {
      const name = 
        route.name === 'Main' 
        ? 'home' 
        : route.name === 'Timetable'
        ? 'calendar'
        : route.name === 'AppSettings'
        ? 'settings'
        : 'person';
      return <Ionicons name={name as any} size={size} color={color} />;
    },
  }),
  screens: {
    Main: { screen: MainStack },
    Timetable: { screen: Timetable },
    AppSettings: { screen: AppSettings, options: { title: 'Settings'} },
    UserPreferences: { screen: UserPreferences, options: { title: 'Profile' } },
  },
});
const AppNavigation = createStaticNavigation(Tabs);

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
