import {Dimensions, Platform} from 'react-native';

let width;
let height;

// Set max width for web dimensions to accommodate .simulator in web/index.html
if (Platform.OS === 'web') {
  const windowWidth = Dimensions.get('window').width;
  width = windowWidth > 500 ? 500 : windowWidth;
  height = Dimensions.get('window').height;
} else {
  width = Dimensions.get('window').width;
  height = Dimensions.get('window').height;
}

const multiplier = width / 400;
const multiplierHeight = height / 680;

// Helper function to round values
const roundValue = (value) => Math.round(value * 100) / 100;

const Dimension = {
  multiplier,
  multiplierHeight,
  calW: (value) => roundValue(value * multiplier),
  calH: (value) => roundValue(value * multiplierHeight),
  deviceWidth: width,
  deviceHeight: height,
  pro5: '5%',
  pro15: '15%',
  pro20: '20%',
  pro30: '30%',
  pro38: '38%',
  pro40: '40%',
  pro49: '49%',
  pro48: '48%',
  pro50: '50%',
  pro60: '60%',
  pro65: '65%',
  pro70: '70%',
  pro75: '75%',
  pro80: '80%', // corregido 90% a 80%
  pro90: '90%',
  pro95: '95%',
  pro100: '100%',
  px1: roundValue(1 * multiplier),
  px2: roundValue(2 * multiplier),
  px5: roundValue(5 * multiplier),
  px8: roundValue(8 * multiplier),
  px10: roundValue(10 * multiplier),
  px12: roundValue(12 * multiplier),
  px13: roundValue(13 * multiplier),
  px14: roundValue(14 * multiplier),
  px15: roundValue(15 * multiplier),
  px16: roundValue(16 * multiplier),
  px17: roundValue(17 * multiplier),
  px18: roundValue(18 * multiplier),
  px20: roundValue(20 * multiplier),
  px23: roundValue(23 * multiplier),
  px25: roundValue(25 * multiplier),
  px28: roundValue(28 * multiplier),
  px30: roundValue(30 * multiplier),
  px35: roundValue(35 * multiplier),
  px40: roundValue(40 * multiplier),
  px45: roundValue(45 * multiplier),
  px50: roundValue(50 * multiplier),
  px60: roundValue(60 * multiplier),
  px70: roundValue(70 * multiplier),
  px80: roundValue(80 * multiplier),
  px90: roundValue(90 * multiplier),
  px100: roundValue(100 * multiplier),
  px150: roundValue(150 * multiplier),
  px200: roundValue(200 * multiplier),
  px220: roundValue(220 * multiplier),
  px250: roundValue(250 * multiplier),
  px300: roundValue(300 * multiplier),
  px340: roundValue(340 * multiplier),
};

export default Dimension;
