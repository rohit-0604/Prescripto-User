import { assets } from "../assets/assets"

const Footer = () => {
  return (
    <div className="md:mx-10">
        <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
            {/* left section */}
            <div>
                <img className="mb-5 w-40" src={assets.logo}></img>
                <p className="w-full md:w-2/3 text-gray-600 leading-6">Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime tempore harum libero labore exercitationem quaerat illo! Fugiat, alias! Neque alias consequuntur quae cumque atque necessitatibus beatae quisquam vero provident illo?</p>
            </div>
            {/* middle section */}
            <div>
                <p className="text-xl font-medium mb-5">COMPANY</p>
                <ul className="flex flex-col gap-2 text-gray-600">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                    <li><a href="/privacy">Privacy Policy</a></li>
                </ul>

            </div>
            {/* right section */}
            <div>
                <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
                <ul className="flex flex-col gap-2 text-gray-600">
                    <li>+893 39482 4562 32</li>
                    <li>example@gmail.com</li>
                </ul>
            </div>
        </div>
        {/* copy right */}
        <div>
            <hr/>
            <p className="py-5 text-sm text-center">Copyright2025@PRESCRIPTO - ALL RIGHTS RESERVED</p>
        </div>
    </div>
  )
}

export default Footer