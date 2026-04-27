import { Alert } from 'react-native';

export default function alert(text: string) {
    Alert.alert(text, '', [
        {text: 'OK', onPress: () => console.log('OK Pressed')},
    ]);
}