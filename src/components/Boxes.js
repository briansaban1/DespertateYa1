import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Colors, Images } from '../constants';

const { width: screenWidth } = Dimensions.get('window');


const data = [
  { id: '1', title: 'Actividades', image: Images.actividades },
  { id: '2', title: 'Ceremonias', image: Images.ceremonias },
  { id: '3', title: 'Tefilot', image: Images.tefilot },
  { id: '4', title: 'Contenidos', image: Images.contenidos },
];

const Box = ({ title, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.box} onPress={onPress}>
      <Image source={image} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const Boxes = () => {
  const handlePress = (title) => {
    Alert.alert('Presionaste', title);
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <Box
          title={item.title}
          image={item.image}
          onPress={() => handlePress(item.title)}
        />
      )}
      keyExtractor={(item) => item.id}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  box: {
    width: screenWidth / 4 - 15,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: Colors.lightbackground,
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 5
  },
  image: {
    width: '50%',
    height: 50,
    borderRadius: 5,
  },
  title: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.blue400
  },
});

export default Boxes;
