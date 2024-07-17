import Layout from "@theme/Layout";
import React from "react";

const Test = props => {
    // const { config: siteConfig, language = '' } = props;

    // const Description = () => (
    //     <Layout title="" description="">
    //         <div padding={['bottom', 'top']} id="description" background="light">

    //         </div>
    //     </Layout>
    // );

    return (
        // <div>
        //     <div className="mainContainer">
        //         <HomeSplash siteConfig={siteConfig} language={language} />
        //         <Description />
        //     </div>
        // </div>
        <Layout
            title="My Page"
            description="Description of my page">
            <header>
                <h1>My Page</h1>
            </header>
            <main>
                <p>Content of my page</p>
            </main>
        </Layout>
    );
}

export default Test;
