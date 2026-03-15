import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';

const RouteMap = forwardRef<any, any>(({ style }, ref) => {
    return (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#12131A' }]}>
            <Text style={{ color: '#8A8D9F' }}>Map preview is not supported on web.</Text>
        </View>
    );
});

export default RouteMap;
