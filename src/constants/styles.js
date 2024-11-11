import { StyleSheet, Dimensions } from 'react-native';

const styles =
  StyleSheet.create({
    flexWrapper:{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    flexWrapper_filter:{
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
     
    },
    submissionEmpty:{
      width: Dimensions.get("window").width * 0.60,
      height: Dimensions.get("window").height * 0.22,
      alignSelf: 'center',
      marginVertical: 5,
      resizeMode: 'contain',
      marginTop: 5,
      
    }
  });

export default styles;
