import React from 'react';
import { View, Dimensions, Image, StyleSheet } from 'react-native';
import Carousel, {ICarouselInstance, Pagination,} from "react-native-reanimated-carousel";
const { width: screenWidth } = Dimensions.get('window');

const images = [
    { uri: 'https://i0.wp.com/abogadocivilpenal.com/wp-content/uploads/2024/02/nueva-prueba-judicial.webp?fit=1280%2C825&ssl=1' },
    { uri: 'https://www.questionpro.com/blog/wp-content/uploads/2022/06/2060-Pruebas-AB-que-son-y-como-realizarlas.jpg' },
    { uri: 'https://i.workana.com/wp-content/uploads/2019/02/ab-testing-split-min.jpg' },
];

const ImageBanner = () => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    const onChangeIndex = (index) => {
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <Carousel
                width={screenWidth}
                height={160}
                data={images}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <Image source={{ uri: item.uri }} style={styles.image} />
                    </View>
                )}
                autoPlay={true}
                loop={true}
                scrollAnimationDuration={4000}
                onIndexChange={onChangeIndex}
            />
           

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    slide: {
        width: screenWidth,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth - 25,
        height: 160,
        borderRadius: 10,
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 16,
        flexDirection:'row'
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
    },
});

export default ImageBanner;
