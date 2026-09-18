import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent memanggil AppRegistry.registerComponent('main', () => App)
// seperti biasa, TAPI ditambah sedikit setup supaya app ini jalan sama baiknya
// baik dibuka lewat Expo Go maupun lewat build native asli nantinya.
registerRootComponent(App);
