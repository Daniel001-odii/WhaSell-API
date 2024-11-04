const nigerianStates = [
    { state: "Abia", neighbors: ["Akwa Ibom", "Anambra", "Cross River", "Ebonyi", "Enugu", "Imo", "Rivers"] },
    { state: "Adamawa", neighbors: ["Borno", "Gombe", "Taraba", "Yobe", "Bauchi"] },
    { state: "Akwa Ibom", neighbors: ["Abia", "Cross River", "Rivers", "Bayelsa"] },
    { state: "Anambra", neighbors: ["Abia", "Delta", "Enugu", "Imo", "Kogi"] },
    { state: "Bauchi", neighbors: ["Gombe", "Jigawa", "Kaduna", "Kano", "Plateau", "Taraba", "Yobe", "Adamawa"] },
    { state: "Bayelsa", neighbors: ["Delta", "Rivers", "Akwa Ibom", "Edo"] },
    { state: "Benue", neighbors: ["Cross River", "Enugu", "Kogi", "Nasarawa", "Taraba", "Ebonyi"] },
    { state: "Borno", neighbors: ["Adamawa", "Gombe", "Yobe", "Bauchi"] },
    { state: "Cross River", neighbors: ["Abia", "Akwa Ibom", "Benue", "Ebonyi", "Enugu"] },
    { state: "Delta", neighbors: ["Anambra", "Bayelsa", "Edo", "Ondo", "Rivers"] },
    { state: "Ebonyi", neighbors: ["Abia", "Benue", "Cross River", "Enugu", "Imo"] },
    { state: "Edo", neighbors: ["Delta", "Kogi", "Ondo", "Ekiti", "Bayelsa"] },
    { state: "Ekiti", neighbors: ["Kwara", "Kogi", "Ondo", "Osun", "Edo"] },
    { state: "Enugu", neighbors: ["Abia", "Anambra", "Benue", "Ebonyi", "Kogi", "Cross River"] },
    { state: "Gombe", neighbors: ["Adamawa", "Bauchi", "Borno", "Taraba", "Yobe"] },
    { state: "Imo", neighbors: ["Abia", "Anambra", "Rivers", "Ebonyi", "Enugu"] },
    { state: "Jigawa", neighbors: ["Bauchi", "Kano", "Katsina", "Yobe", "Zamfara"] },
    { state: "Kaduna", neighbors: ["Bauchi", "Kano", "Katsina", "Kogi", "Niger", "Plateau", "Zamfara"] },
    { state: "Kano", neighbors: ["Bauchi", "Jigawa", "Kaduna", "Katsina", "Zamfara"] },
    { state: "Katsina", neighbors: ["Jigawa", "Kaduna", "Kano", "Zamfara", "Sokoto"] },
    { state: "Kebbi", neighbors: ["Niger", "Sokoto", "Zamfara", "Katsina"] },
    { state: "Kogi", neighbors: ["Anambra", "Benue", "Edo", "Ekiti", "Enugu", "Kwara", "Nasarawa", "Niger", "Ondo", "Plateau"] },
    { state: "Kwara", neighbors: ["Ekiti", "Kogi", "Niger", "Osun", "Oyo", "Ondo"] },
    { state: "Lagos", neighbors: ["Ogun", "Ondo", "Oyo", "Osun"] },
    { state: "Nasarawa", neighbors: ["Benue", "Kogi", "Kaduna", "Plateau", "Taraba", "Niger"] },
    { state: "Niger", neighbors: ["Kaduna", "Kebbi", "Kogi", "Kwara", "Zamfara", "Nasarawa"] },
    { state: "Ogun", neighbors: ["Lagos", "Oyo", "Ondo", "Osun", "Ekiti"] },
    { state: "Ondo", neighbors: ["Ekiti", "Edo", "Kogi", "Osun", "Ogun", "Delta"] },
    { state: "Osun", neighbors: ["Ekiti", "Kwara", "Ogun", "Ondo", "Oyo", "Lagos"] },
    { state: "Oyo", neighbors: ["Kwara", "Ogun", "Osun", "Ondo", "Lagos"] },
    { state: "Plateau", neighbors: ["Bauchi", "Benue", "Kaduna", "Nasarawa", "Taraba", "Kogi"] },
    { state: "Rivers", neighbors: ["Abia", "Akwa Ibom", "Bayelsa", "Delta", "Imo", "Cross River"] },
    { state: "Sokoto", neighbors: ["Kebbi", "Zamfara", "Katsina", "Niger"] },
    { state: "Taraba", neighbors: ["Adamawa", "Bauchi", "Benue", "Gombe", "Nasarawa", "Plateau", "Yobe"] },
    { state: "Yobe", neighbors: ["Adamawa", "Borno", "Bauchi", "Gombe", "Jigawa", "Taraba"] },
    { state: "Zamfara", neighbors: ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Niger", "Sokoto"] }
  ];

  
  module.exports = nigerianStates;