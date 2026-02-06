import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';
import SignIn from '../screens/auth/signin';
import SignUp from '../screens/auth/signup';
import Main from '../screens/app/main';
import Timetable from '../screens/app/timetable';
import AppSettings from '../screens/app/settings';
import UserPreferences from '../screens/app/userPreferences';

const AuthStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    SignIn: { screen: SignIn },
    SignUp: { screen: SignUp },
  },
});

const AuthNavigation = createStaticNavigation(AuthStack);

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
    Main: { screen: Main},
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
  const { user, initializing } = useAuthStore();

  if (initializing){
    return null;
  }

  return user ? <AppNavigation {...props} /> : <AuthNavigation {...props} />;
};
