
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import HorizontalBox from 'components/HorizontalBox';

const AppSettings = ( ) => {

  const onLogout = async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Sign out failed:', e);
      }
    };

    return (
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
        <HorizontalBox title="Logout" buttonText="Logout" iconName={"log-out"} iconColor={"red"} onPress={onLogout} />
      </SafeAreaView>
      
    );
};

export default AppSettings;
