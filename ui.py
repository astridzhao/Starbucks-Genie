import streamlit as st
#=================
# Add Streamlit Components
#=================

# background
page_bg_img = '''
<style>
.stApp  {
background-image: url("https://images.all-free-download.com/images/graphiclarge/abstract_bright_corporate_background_310453.jpg");
background-size: cover;
}
</style>
'''
st.markdown(page_bg_img, unsafe_allow_html=True)

# title
st.title("AI Business Consultant")

# logo
image_url = "https://cdn-icons-png.flaticon.com/512/1998/1998614.png"
st.sidebar.image(image_url, caption="", use_column_width=True)
st.sidebar.write(" This AI Business Consultant is built using AI Multi-Agent system. It can give you business insights, statistical analysis and up-to-date information about any business topic. This AI Multi-Agent Business Consultant delivers knowledge on demand and for FREE!")

# text inputs
business = st.text_input('Enter The Required Business Search Area')
stakeholder = st.text_input('Enter The Stakeholder Team')