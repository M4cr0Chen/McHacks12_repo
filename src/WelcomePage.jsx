

export default function WelcomePage() {
    // const handleGetStarted = () => {
    //     // 这里可以添加实际跳转逻辑或模态框触发
    //     alert('Redirecting to the app...');
    // };
    return (
        <div className="container">


            <p className="description" style={{ color: 'black' }}>
                <span style={{ fontSize: '2em' }}>EchoBrief</span> is designed to record live audio, transcribe spoken content, and generate concise, real-time summaries of conversations or presentations. By automatically capturing key points and organizing them into easily digestible insights, EchoBrief streamlines note-taking, boosts productivity, and ensures that critical information is never lost—all with minimal user effort.
            </p>



            <style>{`
        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
        }

        .first-word-uppercase-p::first-letter {
            font-size: 40px;
            color: #e80222;
            font-weight: bold;
            line-height: 1.6;
            margin-bottom: 2.5rem;
            text-align: justify;
            hyphens: auto;
        }

        .container {
          max-width: 800px;
          padding: 2rem;
          text-align: center;
        }

        .title {
          font-size: 3.5rem;
          color: #2d3436;
          margin-bottom: 1.5rem;
          font-weight: 600;
          letter-spacing: -1px;
        }

        .description {
          font-size: 1.2rem;
          color: #00000;
          line-height: 1.6;
          margin-bottom: 2.5rem;
          text-align: justify;
          hyphens: auto;
        }

        .cta-button {
          padding: 1rem 2.5rem;
          font-size: 1.2rem;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(108, 92, 231, 0.2);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .cta-button:hover {
          background: #5b4bc4;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(108, 92, 231, 0.3);
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }
          
          .description {
            font-size: 1rem;
            text-align: left;
          }
        }
      `}</style>
        </div>
    );
}