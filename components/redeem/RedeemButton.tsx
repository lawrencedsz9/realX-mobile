import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function RedeemButton({ disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>REDEEM</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 65,
    backgroundColor: "#1FA855",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },

  disabled: {
    backgroundColor: "#CCC",
  },

  text: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
});
