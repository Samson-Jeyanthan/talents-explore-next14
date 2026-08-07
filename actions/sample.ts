import axios from "axios";
import { create } from "apisauce";
import APPCONFIG from "../config/appConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/Store";
import { logout, signOut } from "../redux/slice/AuthSlice";

const customAxiosInstance = axios.create({ baseURL: APPCONFIG.endPoint });

// Request interceptor for API calls
customAxiosInstance.interceptors.request.use(
    async (config) => {
        const access_token = await AsyncStorage.getItem("token");
        if (access_token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${access_token}`,
                Accept: "application/json",
            };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

customAxiosInstance.interceptors.response.use((response) => { return response; }, async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || '');
    if (error?.response?.status === 401 && !(originalRequest?._retry)) {
        originalRequest._retry = true;
        let access_token = "";
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const deviceId = "abc123"
        try {
            const response = await appapi
                .get(
                    `auth/access_token?grant_type=refresh_token&refresh_token=${refreshToken}&device_id=${deviceId}`
                );
            if (response && response.ok) {
                const data: any = response.data;
                access_token = data.accessToken;
                await AsyncStorage.setItem('token', access_token);
                await AsyncStorage.setItem("refreshToken", data.refreshToken);
                axios.defaults.headers["Authorization"] = `Bearer ${access_token}`;
                originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
                return axios.request(originalRequest);
            } else {
                store.dispatch(signOut())
            }
        } catch (e) {
            return Promise.reject(error);
        }
    }
    if (
        error?.response?.status === 403 &&
        !requestUrl.includes('auth/logout') &&
        !requestUrl.includes('user/deactivateAccount') &&
        !requestUrl.includes('user/deleteAccount')
    ) {
        store.dispatch(signOut())
    }
    return Promise.reject(error);
});


export const appapi = create({ axiosInstance: customAxiosInstance })



import React, { Component } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { withTheme } from "react-native-paper";
import { ITHEME } from "../../config/theme";
import fonts from "../../config/fonts";
import { hp, wp } from "../../config/dimension";
import AppForm from "../../components/form/AppForm";
import * as Yup from "yup";
import { FormikProps } from "formik";
import icons from "../../config/icons";
import SubmitButton from "../../components/form/SubmitButton";
import { appapi } from "../../api/apiClient";
import { store } from "../../redux/Store";
import { signIn } from "../../redux/slice/AuthSlice";
import Spinner from "react-native-loading-spinner-overlay";
import AuthContainer from "./components/AuthContainer";
import MaterialOutlineFormInput from "../../components/form/MaterialOutlineFormInput";
import LinearGradient from "react-native-linear-gradient";
import { Image } from "react-native";

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .required()
    .strict()
    .lowercase("All characters must be lower case")
    .email("Must be a valid email")
    .label("Email"),
  password: Yup.string().required().trim().label("Password"),
});

class Login extends Component<
  { navigation: any; theme: any },
  { showSpinner: boolean; passwordVisible: boolean }
> {
  state = {
    showSpinner: false,
    passwordVisible: false,
  };
  formik: React.RefObject<FormikProps<any> | null> =
    React.createRef<FormikProps<any | null>>();

  async login(login: any) {
    this.setState({ showSpinner: true });
    // const deviceId = await DeviceInfo.getUniqueId()
    const payload = {
      ...login,
      deviceId: "deviceId",
      appVersion: "Application.nativeApplicationVersion",
    };
    const response = await appapi.post("auth/login", payload);
    if (response.ok) {
      const data: any = response.data;
      if (data.status === "7400") {
        store.dispatch(signIn(data.response));
        this.setState({ showSpinner: false });
      } else {
        this.setState({ showSpinner: false });
        this.formik.current?.setFieldError("password", data.message);
      }
    }
    }
    
  render() {
    const colors: ITHEME = this.props.theme.colors;
    const { passwordVisible } = this.state;
    return (
      <LinearGradient
        colors={["red", "#000000"]} // white → black
        start={{ x: 0, y: 0 }} // top
        end={{ x: 0, y: 0.5 }} // bottom
        style={[styles.container]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/authImages/auth-bg.png")}
            style={styles.topImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "#000"]} // fade from transparent to black
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomFade}
          />
        </View>

        <Spinner
          visible={this.state.showSpinner}
          textStyle={{ color: colors.secondary }}
          color={colors.secondary}
        />
        <View style={{ flex: 1 }}></View>
        <View>
          <AuthContainer
            type="login"
            title={"Login to your account"}
            subTitle={"Please Enter Details to Login"}
          >
            <View style={{ marginHorizontal: wp(32) }}>
              <AppForm
                initialValues={{ email: "", password: "" }}
                onSubmit={(values: any) => {
                  this.login(values);
                }}
                innerRef={this.formik}
                validationSchema={validationSchema}
              >
                <View style={{}}>
                  <MaterialOutlineFormInput
                    name="email"
                    label="Email"
                    isAuthField={true}
                    leftIcon={icons.authIcons.emailIcon}
                    autoCapitalize={"none"}
                    keyboardType="email-address"
                  />
                  <MaterialOutlineFormInput
                    name="password"
                    label="Password"
                    isAuthField={true}
                    leftIcon={icons.authIcons.passwordIcon}
                    secureTextEntry={passwordVisible ? false : true}
                    rightIcon={passwordVisible ? "eye" : "eye-off"}
                    onPressRightIcon={() =>
                      this.setState({
                        passwordVisible: !this.state.passwordVisible,
                      })
                    }
                    autoCapitalize={"none"}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      this.props.navigation.navigate("forgotPassword")
                    }
                    style={styles.forgotPassword}
                  >
                    <Text style={[styles.subTitle, { color: colors.white }]}>
                      Forgot Password
                    </Text>
                  </TouchableOpacity>
                  <View style={{ marginTop: wp(38) }}>
                    <SubmitButton title={"Login"} rightIcon={"login"} />
                  </View>
                  <Text style={[styles.or, { color: colors.white }]}>Or</Text>
                  <View
                    style={[
                      styles.row,
                      { alignItems: "center", justifyContent: "center" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.account,
                        { color: "rgba(180, 180, 180, 1)" },
                      ]}
                    >
                      Don't have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => this.props.navigation.navigate("signUp")}
                    >
                      <Text
                        style={[
                          styles.account,
                          { color: "rgba(242, 51, 51, 1)" },
                        ]}
                      >
                        Join us{" "}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AppForm>
            </View>
          </AuthContainer>
        </View>
      </LinearGradient>
    );
  }
}

export default withTheme(Login);