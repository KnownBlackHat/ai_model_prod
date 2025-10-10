import { GoogleLogin } from "@react-oauth/google";
import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS));

export const GoogleOauthButton = () => {
    async function OnSuccess(credentialResponse) {
        const payload = await jwtVerify(credentialResponse.credential, JWKS);

    }

    async function OnError() {
        console.log("Login Failed");
    }

    return <>
        <GoogleLogin
            onSuccess={OnSuccess}
            onError={OnError}
            size="large"
            shape="circle"
            text="signin_with"
            auto_select={true}

        />

    </>

}
