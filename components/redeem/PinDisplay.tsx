import { View, Text, StyleSheet } from "react-native";

export default function PinDisplay({ pin }) {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.box, pin.length === i && styles.active]}
        >
          <Text style={styles.text}>
            {pin.length > i ? "•" : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  box: {
    width: 65,
    height: 65,
    backgroundColor: "#FFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  active: {
    borderWidth: 2,
    borderColor: "#1FA855",
  },

  text: {
    fontSize: 28,
  },
});
