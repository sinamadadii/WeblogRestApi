const Yup = require("yup");

exports.schema = Yup.object().shape({
    
    username: Yup.string()
        .required("نام کاربری الزامی می باشد")
        .matches(nameRegex, "Only English letters"),
    password: Yup.string()
        .min(4, "کلمه عبور نباید کمتر از 4 کاراکتر باشد")
        .max(255, "کلمه عبور نباید بیشتر از 255 کاراکتر باشد")
        .required("کلمه عبور الزامی می باشد"),
    confirmPassword: Yup.string()
        .required("تکرار کلمه عبور الزامی می باشد")
        .oneOf([Yup.ref("password"), null], "کلمه های عبور یکسان نیستند"),
});
